"""
The function-calling lifecycle and the multi-tool loop.

    Ask -> Tool request -> Run tool -> Return result -> Model answers

repeated until the model stops asking for tools. The model NEVER executes
tools.py directly - it only ever returns a tool name + arguments; this file
is what actually calls the Python function and feeds the result back.
"""

import json
from typing import Tuple, List, Dict

import anthropic

from config import ANTHROPIC_API_KEY, MODEL_NAME
from schemas import TOOL_SCHEMAS
from tools import (
    get_flight_status,
    search_passenger,
    maintenance_history,
    find_available_gate,
    lookup_aircraft,
    get_weather,
)

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# Maps the tool "name" the model requests back to the real Python function.
TOOL_FUNCTIONS = {
    "get_flight_status": get_flight_status,
    "search_passenger": search_passenger,
    "maintenance_history": maintenance_history,
    "find_available_gate": find_available_gate,
    "lookup_aircraft": lookup_aircraft,
    "get_weather": get_weather,
}

SYSTEM_PROMPT = (
    "You are FlightOps, an AI Operations Officer for AeroWing Airlines. "
    "You have tools that read live flight, maintenance, gate, and weather data. "
    "Always use tools to ground your answers in current data rather than guessing. "
    "For questions that depend on multiple factors (e.g. whether a flight will "
    "depart on time depends on weather AND maintenance AND gate status), call "
    "every tool relevant to those factors before answering - do not stop after "
    "the first tool call if more information is needed to give a complete answer. "
    "If a tool returns {\"status\": \"error\", ...}, explain the failure to the "
    "user in plain language rather than making up an answer."
)

MAX_TOOL_ITERATIONS = 8


def _execute_tool(name: str, arguments: dict) -> dict:
    """Look up the tool the model asked for and run it. The model never does this itself."""
    fn = TOOL_FUNCTIONS.get(name)
    if fn is None:
        return {"status": "error", "message": f"Unknown tool '{name}'"}
    try:
        return fn(**arguments)
    except Exception as exc:
        # Belt-and-suspenders: even if a tool forgot its own try/except,
        # the loop itself must never crash because a tool blew up.
        return {"status": "error", "message": str(exc)}


def run_agent(user_message: str, verbose: bool = True) -> Tuple[str, List[Dict]]:
    """
    Runs the full multi-tool agent loop for one user message.

    Returns (final_answer_text, trace). `trace` is an ordered list of
    {"tool": name, "arguments": {...}, "result": {...}} dicts - the record
    of every tool call actually made, used for the plan/reflection display.
    """
    messages = [{"role": "user", "content": user_message}]
    trace: List[Dict] = []

    for _ in range(MAX_TOOL_ITERATIONS):
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOL_SCHEMAS,
            messages=messages,
        )

        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            final_text = "".join(
                block.text for block in response.content if block.type == "text"
            )
            return final_text, trace

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue

            if verbose:
                print(f"  -> calling {block.name}({block.input})")

            result = _execute_tool(block.name, block.input)
            trace.append({"tool": block.name, "arguments": block.input, "result": result})

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result),
            })

        messages.append({"role": "user", "content": tool_results})

    return "FlightOps could not reach a final answer within the tool-call limit.", trace
