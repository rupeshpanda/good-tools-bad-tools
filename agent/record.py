"""
The capture harness for the Good Tools, Bad Tools lab.

Runs the same three questions against all four schema variants (see
variants.py) and writes the full wire-level transcript of every run to
data/traces/*.json for the website to replay.

Everything except the tool declarations is held constant across variants:
same model, same system prompt, same questions, same Python functions, same
mock data. Read variants.py for why that isolation is the entire point.

Each scenario is run RUNS_PER_VARIANT times because these failures are
*probabilistic*, not deterministic. A single run would let you claim almost
anything. Recording several makes the reliability difference visible instead
of asserted - which is the honest way to show it.

The three scenarios here are not the ones this lab started with. Five earlier
candidates were recorded and dropped because lazy and complete behaved
identically; see RETIRED_SCENARIOS. That null result is reported on the site
rather than buried, because it explains WHERE description quality actually
bites: not on choosing between well-named tools, but on getting arguments
right, which a name can never express.

Usage:
    python record.py              # record everything
    python record.py --runs 5     # more repeats per variant
"""

import argparse
import json
import time
from pathlib import Path
from typing import Any, Dict, List

import anthropic

from config import ANTHROPIC_API_KEY, MODEL_NAME
from variants import VARIANTS, VARIANT_META, resolve_tool_name
from agent import SYSTEM_PROMPT, TOOL_FUNCTIONS, MAX_TOOL_ITERATIONS

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "traces"
RUNS_PER_VARIANT = 3


# ---------------------------------------------------------------------------
# The three scenarios.
#
# Each one is chosen because the mock data in data.py gives it a single,
# checkable right answer - so "the lazy run got this wrong" is a fact about
# the data, not a matter of taste. `ground_truth` records that answer and
# how it is reachable; the website shows it next to both transcripts.
# ---------------------------------------------------------------------------
SCENARIOS = [
    {
        "id": "wasted-call",
        "title": "The argument nobody specified",
        "question": "Will UA455 make it out of Chicago tonight?",
        "failure_mode": "Wasted call",
        "severity": 1,
        "teaches": (
            "A tool name can tell the model WHAT a tool does. It can never tell "
            "the model what the argument should look like. Asked about Chicago, "
            "the agent passes 'Chicago' - which is not an airport code - and "
            "burns a round trip discovering that."
        ),
        "cost": (
            "Recoverable, and the cheapest failure here: one wasted call, one "
            "extra second, one extra bill line. It matters because it is the "
            "same root cause as the two below, caught early."
        ),
        "ground_truth": {
            "answer": (
                "It is already delayed 35 minutes, and ORD has thunderstorms "
                "with 47 kph winds."
            ),
            "why": (
                "'Chicago' has to be resolved to the IATA code ORD before the "
                "weather service can answer. Only the description carries that "
                "requirement - the parameter is a bare string either way."
            ),
            "required_tools": ["get_flight_status", "get_weather"],
            "required_arguments": {"get_weather": {"airport": "ORD"}},
        },
    },
    {
        "id": "thrashing",
        "title": "The agent that could not find the terminal",
        "question": (
            "AA118 needs to be moved to a different gate in Terminal 2. Which one?"
        ),
        "failure_mode": "Thrashing",
        "severity": 2,
        "teaches": (
            "Given a bare `terminal: string`, the agent guesses 'Terminal 2', "
            "then '2', then wanders into an unrelated tool, then tries 'B'. It "
            "is not confused about which tool to use - it cannot work out what "
            "the argument is supposed to look like, and there is nowhere to "
            "find out."
        ),
        "cost": (
            "Visible failure. Latency and token spend multiply, and in one of "
            "the recorded runs the agent never reaches an answer at all. This "
            "is the good case: at least it is obvious that something broke."
        ),
        "ground_truth": {
            "answer": "Gate B14 - the first open gate in T2.",
            "why": (
                "The terminals are keyed 'T1'...'T4'. 'Terminal 2' and '2' both "
                "miss. One line of prose - \"Terminal identifier, e.g. 'T2'\" - "
                "removes the entire problem."
            ),
            "required_tools": ["find_available_gate"],
            "required_arguments": {"find_available_gate": {"terminal": "T2"}},
        },
    },
    {
        "id": "wrong-airport",
        "title": "The wrong end of the route",
        "question": "Should I be worried about James Okafor's flight?",
        "failure_mode": "Silently wrong",
        "severity": 3,
        "teaches": (
            "This is the one that should worry you. Both agents call the same "
            "tools, in a sensible order, and every single call returns ok. The "
            "lazy agent simply checks the weather at JFK - where the flight is "
            "going - instead of SFO, where it has to take off. Nothing in the "
            "trace looks wrong, because nothing failed."
        ),
        "cost": (
            "No error, no retry, no warning. An operations officer reads a "
            "fluent, well-sourced answer saying conditions are clear, while the "
            "departure airport sits under 0.8 km of fog. You cannot catch this "
            "by checking whether the tools succeeded - only by checking whether "
            "they were asked the right question."
        ),
        "ground_truth": {
            "answer": (
                "Yes - James Okafor is on AA118 out of SFO, which is under dense "
                "fog with 0.8 km visibility."
            ),
            "why": (
                "AA118 flies SFO -> JFK. The departure risk lives at the origin. "
                "JFK is clear at 10 km, so checking the destination returns a "
                "healthy-looking reading that is entirely irrelevant to whether "
                "this flight gets off the ground."
            ),
            "required_tools": [
                "search_passenger", "get_flight_status", "get_weather",
            ],
            "required_arguments": {"get_weather": {"airport": "SFO"}},
        },
    },
]

RETIRED_SCENARIOS = [
    # Kept as an honest record: these were expected to differentiate and did
    # not. Across two runs per variant, lazy and complete behaved identically.
    # The reason is worth more than the scenarios were - the tool NAME already
    # carries most of "which tool", so gutting the prose changes nothing until
    # the question turns on an ARGUMENT the name cannot describe.
    {"id": "gate-lookup", "question": "Which gate should I send the AA118 passengers to?"},
    {"id": "fit-to-fly", "question": "Is the aircraft flying AA119 fit to fly?"},
    {"id": "seat-capacity", "question": "How many seats does the aircraft on AA119 have?"},
    {"id": "type-decoy", "question": "What is the maintenance status of the B738 flying AA119?"},
    {"id": "on-time", "question": "Is AA118 likely to depart on time?"},
]

def _execute_tool(name: str, arguments: dict) -> dict:
    """
    Identical to agent.py's executor - the model never runs this itself.

    `resolve_tool_name` maps opaque variant names (tool_a..tool_f) back to
    real functions, so all four variants execute exactly the same code.
    """
    fn = TOOL_FUNCTIONS.get(resolve_tool_name(name))
    if fn is None:
        return {"status": "error", "message": f"Unknown tool '{name}'"}
    try:
        return fn(**arguments)
    except Exception as exc:
        return {"status": "error", "message": f"{type(exc).__name__}: {exc}"}


def record_run(question: str, tools: List[dict], run_index: int) -> Dict[str, Any]:
    """
    Runs one full agent loop, capturing the raw wire format at every turn.

    This is agent.py's loop with instrumentation bolted on. It is written out
    longhand rather than imported because the shape of the exchange - assistant
    emits tool_use, developer's code returns tool_result - is the thing the
    lab is trying to make visible.
    """
    messages: List[Dict[str, Any]] = [{"role": "user", "content": question}]
    turns: List[Dict[str, Any]] = []
    tool_calls: List[Dict[str, Any]] = []
    started = time.time()

    for turn_index in range(MAX_TOOL_ITERATIONS):
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )

        assistant_blocks = []
        for block in response.content:
            if block.type == "text":
                assistant_blocks.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                assistant_blocks.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })

        turn = {
            "index": turn_index,
            "stop_reason": response.stop_reason,
            "assistant": assistant_blocks,
            "tool_results": [],
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        }

        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            turns.append(turn)
            final_text = "".join(
                b["text"] for b in assistant_blocks if b["type"] == "text"
            )
            return {
                "run": run_index,
                "final_answer": final_text,
                "turns": turns,
                "tool_calls": tool_calls,
                "hit_iteration_limit": False,
                "elapsed_ms": int((time.time() - started) * 1000),
            }

        api_tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue

            result = _execute_tool(block.name, block.input)
            print(f"      -> {block.name}({json.dumps(block.input)})"
                  f" => {result.get('status')}")

            tool_calls.append({
                # `name` is what the model asked for (tool_f in the opaque
                # variants); `resolved` is the function that actually ran, so
                # the site can compare tool choice across all four variants.
                "name": block.name,
                "resolved": resolve_tool_name(block.name),
                "input": block.input,
                "result": result,
            })
            turn["tool_results"].append({
                "tool_use_id": block.id,
                "name": block.name,
                "content": result,
            })
            api_tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result),
            })

        turns.append(turn)
        messages.append({"role": "user", "content": api_tool_results})

    return {
        "run": run_index,
        "final_answer": None,
        "turns": turns,
        "tool_calls": tool_calls,
        "hit_iteration_limit": True,
        "elapsed_ms": int((time.time() - started) * 1000),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=RUNS_PER_VARIANT)
    parser.add_argument("--scenario", type=str, default=None,
                        help="Record only this scenario id.")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    scenarios = [s for s in SCENARIOS
                 if args.scenario is None or s["id"] == args.scenario]

    index = []
    for scenario in scenarios:
        print(f"\n=== {scenario['id']}: {scenario['question']}")
        record = {
            **{k: v for k, v in scenario.items()},
            "model": MODEL_NAME,
            "system_prompt": SYSTEM_PROMPT,
            "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "runs_per_variant": args.runs,
            "variant_meta": VARIANT_META,
            "variants": {},
        }

        for variant_name, tools in VARIANTS.items():
            print(f"  -- {variant_name}")
            runs = []
            for i in range(args.runs):
                print(f"    run {i + 1}")
                runs.append(record_run(scenario["question"], tools, i + 1))
            record["variants"][variant_name] = {"schemas": tools, "runs": runs}

        path = OUT_DIR / f"{scenario['id']}.json"
        path.write_text(json.dumps(record, indent=2), encoding="utf-8")
        print(f"  written -> {path}")
        index.append({
            "id": scenario["id"],
            "title": scenario["title"],
            "failure_mode": scenario["failure_mode"],
            "question": scenario["question"],
        })

    (OUT_DIR / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"\nAll traces written to {OUT_DIR}")


if __name__ == "__main__":
    main()
