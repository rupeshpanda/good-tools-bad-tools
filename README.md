# Good Tools, Bad Tools

**The model never sees your code — only the sentence you wrote about it.**

An Elegance AI lab. Two agents are given identical questions, identical Python
functions, identical mock data, an identical system prompt, and the same model.
The only thing that differs is the English prose describing each tool. One of
them tells an operations officer not to worry about a flight sitting under fog,
and makes no errors doing it.

Live: **https://eleganceai.ai/lab/good-tools-bad-tools**

---

## What this is

A small flight-operations agent (`FlightOps`) with six read-only tools, plus a
capture harness that runs it against four different sets of tool declarations
and records every exchange at the wire level. The site replays those recordings.

Nothing on the site calls a model at request time. These failures are
probabilistic, so a live run could accidentally succeed and quietly contradict
the page illustrating it. Every recorded run is published — none are chosen.

## The 2×2

A tool declaration gives the model two channels: the tool's **name** and its
**description**. Comparing one good schema against one bad one changes both at
once, so each channel is varied independently.

|                    | Complete description | Lazy description |
| ------------------ | -------------------- | ---------------- |
| **Real names**     | `complete`           | `lazy`           |
| **Names stripped** | `prose_only`         | `nothing`        |

In the stripped variants every tool becomes `tool_a`…`tool_f`, and
cross-references inside the prose are rewritten so no real name leaks back in.

## Results

Three scenarios, three runs per variant, 36 runs total. A run counts as correct
only if it called the required tools *with the required arguments*.

| Variant      | Correct | Notes                                             |
| ------------ | ------- | ------------------------------------------------- |
| `complete`   | **9/9** | baseline                                          |
| `prose_only` | **9/9** | names stripped entirely — no measurable difference |
| `nothing`    | 7/9     |                                                   |
| `lazy`       | 5/9     |                                                   |

**1. The description carries the signal; the name carries almost none.**
Anonymising every tool name changed nothing. Gutting the descriptions changed
everything.

**2. Every failure by a named agent was an argument, not a tool choice.**
`"Chicago"` instead of `ORD`. `"Terminal 2"` instead of `T2`. `JFK` instead of
`SFO`. Across 36 runs only 2 reached for an irrelevant tool, and both were in
the variant with no usable names at all. An argument format is exactly what a
function name cannot express.

**3. The worst failure produced no errors.** In `wrong-airport`, the lazy agent
called sensible tools in a sensible order, got `status: ok` back every time, and
answered using weather from the destination instead of the departure airport —
3 runs out of 3. No error-rate dashboard would show anything wrong.

**4. Five scenarios we expected to break didn't.** Gate lookup, fit-to-fly, seat
capacity, an aircraft-type decoy, and on-time were all built to make a lazy
agent pick the *wrong tool*. Lazy and complete behaved identically on every one.
That null result is what redirected the lab towards arguments; it is recorded in
`RETIRED_SCENARIOS` in `agent/record.py` rather than quietly dropped.

**Cost, honestly:** complete schemas cost ~1767 input tokens per turn against
~976 for lazy — about +81%, re-sent on every turn of every conversation, not
once. It is still cheaper here, because the lazy runs spend the savings
immediately on retries and buy a wrong answer with them.

## Layout

```
agent/                  the Python agent and the capture harness
  data.py               mock flight/passenger/maintenance/gate/weather records
  tools.py              six plain functions — no LLM code at all
  schemas.py            the COMPLETE tool declarations
  schemas_lazy.py       the LAZY declarations: same names, same params, worse prose
  variants.py           builds the 2x2, including the name-stripped variants
  agent.py              the tool-calling loop
  planner.py            a tool-free call that plans before acting
  reflector.py          a tool-free call that critiques the finished run
  record.py             runs every scenario x variant and captures the transcripts
  export_wall.py        pairs each function's real source with its declarations
data/traces/*.json      every recorded run, committed
data/wall.json          generated code/schema pairing for the guide page
app/, components/, lib/ the Next.js site
```

`export_wall.py` reads the function source with `inspect.getsource`, so the
Python shown on the site cannot drift from the Python that ran.

## Reproduce

```bash
git clone https://github.com/rupeshpanda/good-tools-bad-tools
cd good-tools-bad-tools/agent
pip install -r requirements.txt
cp .env.example .env          # add your ANTHROPIC_API_KEY

python tools.py               # the functions alone, with no model involved
python record.py --runs 3     # re-record every scenario against every variant
python export_wall.py         # regenerate the code/schema pairing
```

Then the site:

```bash
npm install
npm run dev
```

Expect your numbers to differ slightly. That is the point.

## Notes

- Synthetic data only. No real airline, aircraft, or passenger is represented.
  Airports and aircraft types are real so the scenarios read naturally.
- Model: `claude-sonnet-4-5-20250929`, default temperature.
- Three runs per variant is enough to show a difference and far too few to
  measure one. Claims here are scoped accordingly, and one tempting result is
  explicitly *not* claimed on the site for that reason.

## Licence

MIT.
