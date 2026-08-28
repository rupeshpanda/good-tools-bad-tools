import Link from "next/link";
import type { Metadata } from "next";
import { Header, Footer, SectionLabel } from "@/components/Chrome";
import Experiment, { VerdictLegend, TokenNote } from "@/components/Experiment";
import BlindTest from "@/components/BlindTest";
import { loadAllScenarios } from "@/lib/traces";
import { variantScore, type Scenario, type VariantKey } from "@/lib/types";

export const metadata: Metadata = {
  title: "Good Tools, Bad Tools | Elegance AI",
  description:
    "Same agent, same functions, same data — only the tool descriptions change. A recorded 2x2 experiment showing where description quality actually decides whether an agent is right or wrong.",
};

export default function LabPage() {
  const scenarios = loadAllScenarios();
  const headline = scenarios.find((s) => s.id === "wrong-airport")!;

  const completeAnswer = headline.variants.complete.runs[0].final_answer ?? "";
  const lazyAnswer = headline.variants.lazy.runs[0].final_answer ?? "";

  const totals = summarise(scenarios);

  return (
    <>
      <Header current="lab" />

      <main className="mx-auto w-full max-w-5xl px-5">
        {/* Hero */}
        <section className="py-16">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="tag-badge">Tool calling</span>
            <span className="tag-badge">Agents</span>
            <span className="tag-badge">Claude</span>
          </div>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight text-navy md:text-5xl">
            Good Tools, Bad Tools
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink">
            Two agents. Identical questions, identical Python functions,
            identical data, identical system prompt, identical model. The only
            difference between them is the English sentence describing each
            tool.
          </p>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink">
            One of them tells an operations officer not to worry about a flight
            that is sitting under fog. It makes no errors doing it.
          </p>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted">
            New to tool calling? Start with{" "}
            <Link
              href="/lab/good-tools-bad-tools/guide"
              className="text-accent underline underline-offset-2 hover:text-accent-hover"
            >
              what a tool actually is
            </Link>
            , then come back.
          </p>
        </section>

        {/* Blind test */}
        <section className="border-t border-border py-14">
          <SectionLabel>First · a test for you</SectionLabel>
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            One of these agents checked the wrong airport
          </h2>
          <div className="mt-6">
            <BlindTest
              prompt={`Both agents were asked: "${headline.question}" James Okafor is booked on AA118, which flies SFO → JFK. Departure risk lives at the origin. One of these two checked SFO. The other checked JFK. Neither produced a single error. Which one would you have acted on?`}
              answerA={lazyAnswer}
              answerB={completeAnswer}
              correct="B"
              revealNote="Agent A checked the weather at JFK — the destination — and reported it as reassurance. SFO, where the aircraft actually has to take off, was under dense fog at 0.8 km visibility. Agent B even names JFK in its answer, so a careful reader could in principle catch it, buried among five green ticks. Nothing failed. No tool returned an error. No retry fired. There is no monitoring rule of the form 'alert when a tool call errors' that would have caught this, because nothing errored — the tool was simply asked about the wrong place."
            />
          </div>
        </section>

        {/* The experiment */}
        <section className="border-t border-border py-14">
          <SectionLabel>The experiment</SectionLabel>
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            Three questions, four schema variants, every run shown
          </h2>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-ink">
            Each scenario below has one checkable right answer, fixed by the
            mock data. Each was run{" "}
            {headline.runs_per_variant} times against each variant, because
            these failures are probabilistic rather than deterministic — a
            single run would let you claim almost anything.
          </p>
          <div className="mt-4 mb-8">
            <VerdictLegend />
          </div>

          <Experiment scenarios={scenarios} />
        </section>

        {/* Findings */}
        <section id="findings" className="border-t border-border py-14">
          <SectionLabel>What the runs actually showed</SectionLabel>
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            Four findings, including one that cost us two scenarios
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Finding
              n="01"
              claim="The description carries the signal. The name carries almost none."
              evidence={`Stripping every tool name to tool_a…tool_f while keeping the descriptions scored ${totals.proseOnly}/${totals.runs} — identical to the fully-named version. Keeping the names but gutting the descriptions scored ${totals.lazy}/${totals.runs}.`}
              soWhat="Teams tend to argue about naming and treat the description as a comment. It is the other way round. The name is a convenience for you; the description is the interface for the model."
            />
            <Finding
              n="02"
              claim="Every failure we could reproduce was an argument, not a tool choice."
              evidence="'Chicago' instead of ORD. 'Terminal 2' instead of T2. JFK instead of SFO. Across all 36 recorded runs, only 2 ever reached for an irrelevant tool — and both were in the variant with no usable names at all. Every failure of a named agent was the right tool handed the wrong thing."
              soWhat="An argument format is exactly what a function name cannot express. If you write only one useful sentence per tool, make it the one that says what the parameter looks like."
              tone="accent"
            />
            <Finding
              n="03"
              claim="The worst failure produced no errors at all."
              evidence={`In the wrong-airport scenario the lazy agent called the same tools in a sensible order, got status: ok back every time, and answered confidently using weather from the wrong end of the route — ${totals.silentRuns} of ${headline.runs_per_variant} runs.`}
              soWhat="Error-rate monitoring cannot see this. A dashboard of tool-call success rates would show a green board while the agent quietly answers the wrong question. Correctness has to be checked against what the tools were asked, not whether they replied."
              tone="danger"
            />
            <Finding
              n="04"
              claim="Five scenarios we expected to break didn't, and that was the useful part."
              evidence="Gate lookup, fit-to-fly, seat capacity, aircraft-type decoy, and on-time — all designed to make a lazy agent pick the wrong tool. Lazy and complete behaved identically on every one."
              soWhat="Well-named tools are genuinely hard to confuse. Description quality does not bite where we assumed it would — on tool selection — and reporting that honestly is what pointed us at arguments instead."
            />
          </div>

          <div className="mt-8">
            <TokenNote scenario={headline} />
          </div>

          <div className="mt-6 rounded-lg border border-border bg-bg-secondary p-6">
            <span className="section-label">One we are not claiming</span>
            <p className="max-w-3xl text-[14.5px] leading-relaxed text-ink">
              Across all three scenarios the lazy variant scored{" "}
              {totals.lazy}/{totals.runs} while the variant with{" "}
              <em>no usable names at all</em> scored {totals.nothing}/
              {totals.runs}. Taken at face value that says a good name attached
              to a bad description is worse than no name — perhaps because a
              familiar label like <code className="font-mono">get_weather</code>{" "}
              makes the model confident enough to stop reading.
            </p>
            <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-ink">
              We are not claiming it. Nearly the whole gap comes from a single
              scenario, and in the other two the pair are level. It is a tidy
              story built on a handful of runs, which is exactly the kind of
              thing that evaporates at n=30. Worth testing properly; not worth
              believing yet.
            </p>
          </div>
        </section>

        {/* Writeup */}
        <section className="border-t border-border py-14">
          <SectionLabel>The honest writeup</SectionLabel>
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            Four questions worth answering before you ship tools
          </h2>

          <div className="mt-8 space-y-8">
            <Essay
              q="Grounding here means calling the right function, not retrieving the right passage. What actually changes about the risk?"
              body={[
                "Retrieval grounding is read-only and fails soft: pull the wrong passage and you get a wrong or irrelevant answer, but nothing in the world changes. Function-calling grounding fails hard. The wrong tool, or the right tool with the wrong argument, does something — here at worst a misleading answer, but in a system with write tools it is a cancelled booking or a reassigned gate.",
                "The error surface also compounds. Each call's output becomes the next call's input, so a single wrong argument early on propagates quietly through everything downstream. The wrong-airport scenario is exactly that: one argument, four tool calls, zero errors, and a confident recommendation built on a reading from the wrong city. Retrieval risk is about information quality. Tool-calling risk is about information quality and action correctness and sequencing.",
              ]}
            />
            <Essay
              q="A function and its declaration drift apart — someone renames a parameter. What happens, and how would you catch it?"
              body={[
                "The model only knows what the declaration says, so it keeps sending the old parameter name, and the fn(**arguments) call raises a TypeError for an unexpected keyword argument. In this project that is caught by the try/except in the executor, so the loop survives and the model receives a structured error it can explain — but the user still gets a degraded answer instead of the tool actually running.",
                "Catching it before a user does is cheap and nobody does it: keep a test that imports every function named in the schema list, reads its real parameter names with inspect.signature, and asserts they match the input_schema properties. That is a handful of lines and it turns a silent production degradation into a failed build. The same idea generated this lab's wall.json — the Python shown on the guide page is extracted from the live function objects rather than copied, so it cannot drift from what actually ran.",
              ]}
            />
            <Essay
              q="The agent is asked to cancel a booking or reassign a gate, not just look things up. What changes?"
              body={[
                "Read tools are idempotent and reversible by construction. Calling get_flight_status twice, or on the wrong flight, costs nothing — which is why every failure in this lab is recoverable. A cancel or reassign tool has no undo, and autonomous execution means a misread name or an over-eager plan reaches a real passenger before any human sees the request.",
                "The safeguard follows directly from the lifecycle on the guide page: the model never executes anything, it only requests. So tag write tools, and have the loop stop on them — the model proposes the call with a plain-English summary of the effect, and a human approves before the function runs. That is not a new capability, it is a branch in code you already control. The uncomfortable part is that the wrong-airport result shows a human approving a fluent, well-sourced request is a weaker check than it feels like.",
              ]}
            />
            <Essay
              q="Which mattered more: description quality or system prompt quality?"
              body={[
                "Description quality, and the experiment isolates it. The system prompt was byte-identical across all four variants and never names or describes an individual tool — it says only 'call every tool relevant to those factors'. Everything the model knows about what get_weather does, when it is relevant, and what its argument looks like comes from the schema text.",
                "So the system prompt has nothing to fall back on when the description is thin. It can push the model to be thorough, and it did: the lazy agent in the wrong-airport scenario was thorough. It checked flight status, maintenance, and weather, in a sensible order, and still answered the wrong question, because thoroughness cannot tell you that departure risk lives at the origin airport. The system prompt governs how hard the agent tries. The descriptions govern whether trying helps.",
              ]}
            />
          </div>
        </section>

        {/* Reproduce */}
        <section className="border-t border-border py-14">
          <SectionLabel>Reproduce it</SectionLabel>
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            Everything here is in the repo
          </h2>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-ink">
            The agent, the four schema variants, the mock data, and the capture
            harness are all committed, along with every recorded run. Point it
            at your own API key and it will overwrite the traces with yours.
          </p>
          <pre className="wire mt-6 rounded-lg border border-border bg-card p-5 text-ink">
            {`git clone https://github.com/rupeshpanda/good-tools-bad-tools
cd good-tools-bad-tools/agent
pip install -r requirements.txt
cp .env.example .env        # add your ANTHROPIC_API_KEY

python tools.py             # the functions, with no model involved
python record.py --runs 3   # re-record every variant
python export_wall.py       # regenerate the code/schema pairing`}
          </pre>
          <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-muted">
            Expect your numbers to differ slightly. These are probabilistic
            failures, which is the point — and why every run is published here
            rather than a chosen one.
          </p>
        </section>
      </main>

      <Footer model={headline.model} recordedAt={headline.recorded_at} />
    </>
  );
}

/** Totals across every scenario, so the findings quote measured numbers. */
function summarise(scenarios: Scenario[]) {
  const tally = (variant: VariantKey) =>
    scenarios.reduce((n, s) => n + variantScore(s, variant).correct, 0);
  const runs = scenarios.reduce(
    (n, s) => n + s.variants.complete.runs.length,
    0,
  );
  const headline = scenarios.find((s) => s.id === "wrong-airport")!;
  return {
    runs,
    complete: tally("complete"),
    lazy: tally("lazy"),
    proseOnly: tally("prose_only"),
    nothing: tally("nothing"),
    silentRuns: variantScore(headline, "lazy").silentlyWrong,
  };
}

function Finding({
  n,
  claim,
  evidence,
  soWhat,
  tone,
}: {
  n: string;
  claim: string;
  evidence: string;
  soWhat: string;
  tone?: "accent" | "danger";
}) {
  const border =
    tone === "danger"
      ? "border-l-danger"
      : tone === "accent"
        ? "border-l-accent"
        : "border-l-border";
  return (
    <div className={`rounded-lg border border-border border-l-2 ${border} bg-card p-6`}>
      <span className="section-label">{n}</span>
      <h3 className="font-serif text-xl leading-snug text-navy">{claim}</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-ink">{evidence}</p>
      <p className="mt-3 border-t border-border pt-3 text-[14px] leading-relaxed text-muted">
        {soWhat}
      </p>
    </div>
  );
}

function Essay({ q, body }: { q: string; body: string[] }) {
  return (
    <div className="max-w-3xl">
      <h3 className="font-serif text-xl leading-snug text-navy">{q}</h3>
      {body.map((p, i) => (
        <p key={i} className="mt-3 text-[15.5px] leading-relaxed text-ink">
          {p}
        </p>
      ))}
    </div>
  );
}
