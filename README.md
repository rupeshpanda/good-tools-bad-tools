# Good Tools, Bad Tools

**The model never sees your code. It sees the declaration you wrote about it.**

An Elegance AI lab. Two agents are given identical questions, identical
functions, identical mock data, an identical system prompt, and the same model.
The only thing that differs is how the tools are described. In the recorded
runs, one of them tells an operations officer not to worry about a flight
sitting under fog, and makes no errors doing it.

Live: **https://eleganceai.ai/lab/good-tools-bad-tools**

---

## What this is

A small flight operations agent with six read only tools.

The **site** is a live demo. You ask one question, and it runs against a lazy
set of tool declarations and a careful set at the same time, showing the tool
call each one constructed and the answer each one reached. Both are real API
calls, made when you press the button.

The **repository** additionally holds the offline experiment that the site's
supporting figures come from: a capture harness that runs the same agent
against four sets of tool declarations and records every exchange at the wire
level. Every recorded run is committed. None were selected.

Because these failures are probabilistic, a live run can come out differently.
The page generates its summary line from the two transcripts it just produced,
so it describes what actually happened rather than asserting a result the
visitor cannot see.

## A note on what a tool is

A tool wraps whatever you point it at: an API call, a database query, an MCP
operation, a step in a workflow. In this lab they happen to be Python
functions, which is a fact about the lab rather than about tools.

What the model receives is the **declaration**: a name, a description, and a
schema for the parameters. Not the code. The experiment below varies the name
and the prose independently to find out which of those two channels is doing
the work.

## The 2x2

Comparing one good schema against one bad one changes both channels at once,
so each is varied on its own.

|                    | Complete description | Lazy description |
| ------------------ | -------------------- | ---------------- |
| **Real names**     | `complete`           | `lazy`           |
| **Names stripped** | `prose_only`         | `nothing`        |

In the stripped variants every tool becomes `tool_a` through `tool_f`, and
cross references inside the prose are rewritten so that no real name leaks
back in.

## Results

Three scenarios, three runs per variant, 36 runs in total. A run counts as
correct only if it called the required tools *with the required arguments*.

| Variant      | Correct | Notes                                              |
| ------------ | ------- | -------------------------------------------------- |
| `complete`   | **9/9** | baseline                                           |
| `prose_only` | **9/9** | names stripped entirely, no measurable difference   |
| `nothing`    | 7/9     |                                                    |
| `lazy`       | 5/9     |                                                    |

**1. The prose carries the signal. The name carries almost none.** Anonymising
every tool name changed nothing. Gutting the descriptions changed everything.

**2. Every failure by a named agent was an argument, not a tool choice.**
`"Chicago"` instead of `ORD`. `"Terminal 2"` instead of `T2`. `JFK` instead of
`SFO`. Across 36 runs only 2 reached for an irrelevant tool, and both were in
the variant with no usable names at all. An argument format is exactly what a
function name cannot express.

**3. The worst failure produced no errors.** In `wrong-airport` the lazy agent
called sensible tools in a sensible order, received `status: ok` every time,
and answered using weather from the destination instead of the departure
airport. Three runs out of three. No error rate dashboard would show anything
wrong.

**4. Five scenarios that were expected to break did not.** Gate lookup,
fit to fly, seat capacity, an aircraft type decoy, and on time were all built
to make a lazy agent pick the *wrong tool*. Lazy and complete behaved
identically on every one. That null result is what redirected the lab towards
arguments. It is recorded in `RETIRED_SCENARIOS` in `agent/record.py` rather
than quietly dropped.

**Cost, honestly.** Complete schemas cost roughly 1767 input tokens per turn
against 976 for lazy, about 81 per cent more, re-sent on every turn of every
conversation rather than once. It is still the cheaper option here, because
the lazy runs spend the saving immediately on retries and buy a wrong answer
with it.

## Layout

```
agent/                  the Python agent and the capture harness
  data.py               mock flight, passenger, maintenance, gate and weather records
  tools.py              six plain functions, no LLM code at all
  schemas.py            the COMPLETE tool declarations
  schemas_lazy.py       the LAZY declarations: same names, same params, worse prose
  variants.py           builds the 2x2, including the name stripped variants
  agent.py              the tool calling loop
  planner.py            a tool free call that plans before acting
  reflector.py          a tool free call that critiques the finished run
  record.py             runs every scenario against every variant and captures transcripts
  export_wall.py        pairs each function's real source with its declarations
  export_schemas.py     generates lib/live/schemas.ts from the Python schemas
data/traces/*.json      every recorded run, committed
data/wall.json          generated code and schema pairing
lib/live/               the live demo: a TS port of the tools, plus the agent loop
  schemas.ts            GENERATED. Do not edit; run agent/export_schemas.py
app/api/.../run         the live endpoint, rate limited, one variant per call
app/, components/       the Next.js site
```

Two generated files keep the site honest. `export_wall.py` reads function
source with `inspect.getsource`, and `export_schemas.py` emits the TypeScript
tool declarations from the Python ones, so the live demo and the recorded
experiment cannot silently end up describing different tools.

`lib/live/tools.ts` is a hand port of `agent/tools.py` and is the one place
where drift is still possible. Keep them in step.

## Reproduce

```bash
git clone https://github.com/rupeshpanda/good-tools-bad-tools
cd good-tools-bad-tools/agent
pip install -r requirements.txt
cp .env.example .env          # add your ANTHROPIC_API_KEY

python tools.py               # the functions alone, with no model involved
python record.py --runs 3     # re-record every scenario against every variant
python export_wall.py         # regenerate the code and schema pairing
```

Then the site:

```bash
npm install
cp .env.example .env.local    # ANTHROPIC_API_KEY, the same key
npm run dev
```

The live endpoint needs `ANTHROPIC_API_KEY` in the environment. Without it the
demo returns a clear "not configured" message rather than failing obscurely.

Expect your numbers to differ slightly. That is the point.

## Notes

- Synthetic data only. No real airline, aircraft, or passenger is represented.
  The airports and aircraft types are real so the scenarios read naturally.
- Model: `claude-sonnet-4-5-20250929`, default temperature.
- Three runs per variant is enough to show a difference and far too few to
  measure one. Claims here are scoped accordingly, and one tempting result is
  explicitly *not* claimed on the site for that reason.

## Licence

MIT.
