import Link from "next/link";
import type { Metadata } from "next";
import { Header, Footer, SectionLabel } from "@/components/Chrome";
import TheWall from "@/components/TheWall";
import WireWalkthrough from "@/components/WireWalkthrough";
import { loadScenario } from "@/lib/traces";
import { loadWall, wallTotals } from "@/lib/wall";

export const metadata: Metadata = {
  title: "What a tool actually is | Good Tools, Bad Tools",
  description:
    "A tool is code you already wrote plus a declaration describing it. The model never sees the code. Walk the tool calling lifecycle on a real recorded transcript.",
};

export default function GuidePage() {
  const wall = loadWall();
  const totals = wallTotals(wall);
  const scenario = loadScenario("wrong-airport");
  const walkthroughRun = scenario.variants.complete.runs[0];

  return (
    <>
      <Header current="guide" />

      <main className="mx-auto w-full max-w-5xl px-5">
        {/* Hero */}
        <section className="py-16">
          <SectionLabel>Part one · the mechanism</SectionLabel>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight text-navy md:text-5xl">
            A tool is code you already wrote, plus a declaration describing it.
            The model only ever sees the declaration.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink">
            Almost everything that goes wrong with tool calling follows from that
            one asymmetry. This page walks the mechanism end to end on a real
            recorded transcript. What a tool is. What actually crosses the wire.
            Who runs what. The{" "}
            <Link
              href="/lab/good-tools-bad-tools"
              className="text-accent underline underline-offset-2 hover:text-accent-hover"
            >
              live demo
            </Link>{" "}
            then lets you watch what happens when the sentence is a bad one.
          </p>
        </section>

        {/* 1. What a tool is */}
        <section className="border-t border-border py-14">
          <SectionLabel>01 · What a tool is</SectionLabel>
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            Nothing about a tool is an AI concept
          </h2>
          <div className="mt-5 grid gap-8 md:grid-cols-2">
            <div className="space-y-4 text-[15.5px] leading-relaxed text-ink">
              <p>
                A tool can wrap anything you already have: an API call, a
                database query, an MCP operation, a step in a workflow. The six
                in this lab happen to be ordinary Python functions that read
                flight, passenger, maintenance, gate, and weather records for a
                fictional US airline. They worked before any model was involved
                and they would keep working if you deleted the model tomorrow.
              </p>
              <p>
                What makes that code a <em>tool</em> is the declaration you
                write alongside it: a name, a description, and a schema for the
                parameters. That declaration is not documentation. Nobody on
                your team will ever read it. It is an interface, and it is the
                only one the model has.
              </p>
              <p className="border-l-2 border-accent pl-4 text-muted">
                Turn on <strong className="text-ink">Show the model&apos;s
                view</strong> below. What remains is genuinely everything it
                gets. Not the function body, not the docstring, not the data. It
                cannot check whether your sentence is true, and it will not
                notice when it is wrong.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-5 self-start rounded-lg border border-border bg-card p-6">
              <Metric value={totals.toolCount} label="tools" />
              <Metric value={totals.pythonLines} label="lines of Python" />
              <Metric value={0} label="lines the model sees" tone="danger" />
              <Metric
                value={totals.completeChars}
                label="characters of prose it does see"
                tone="accent"
              />
            </dl>
          </div>

          <div className="mt-8">
            <TheWall tools={wall.tools} totals={totals} />
          </div>
        </section>

        {/* 2. The lifecycle */}
        <section className="border-t border-border py-14">
          <SectionLabel>02 · The lifecycle</SectionLabel>
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            The model never runs your code
          </h2>
          <div className="mt-5 max-w-2xl space-y-4 text-[15.5px] leading-relaxed text-ink">
            <p>
              This is the part most explanations skip, and it is the part that
              matters for anyone responsible for what an agent is allowed to do.
              When a model calls a tool, it does not execute anything. It returns
              a block of JSON containing a name, some arguments, and an id.
            </p>
            <p>
              That is a <em>request</em>. Your own loop reads it and decides what
              to do. Call the function. Refuse. Log it. Rate limit it. Stop and
              ask a human. Every side effect an agentic system has ever produced
              was a line of your code choosing to honour a request.
            </p>
            <p className="text-muted">
              Step through a real exchange below. It is run 1 of the{" "}
              <code className="font-mono text-[13.5px] text-ink">
                wrong-airport
              </code>{" "}
              scenario, recorded against{" "}
              <code className="font-mono text-[13.5px] text-ink">
                {scenario.model}
              </code>
              . Watch for the gold step. That one is yours, not the
              model&apos;s.
            </p>
          </div>

          <div className="mt-8">
            <WireWalkthrough
              run={walkthroughRun}
              question={scenario.question}
            />
          </div>
        </section>

        {/* 3. What a description must answer */}
        <section className="border-t border-border py-14">
          <SectionLabel>03 · What a description is for</SectionLabel>
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            Four questions, or the model guesses
          </h2>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-ink">
            Here is a useful test. Hand your tool declaration to a competent
            stranger with no access to the codebase and ask them to use it
            correctly on the first try. Whatever they have to ask you is what is
            missing. Four questions come up every time.
          </p>

          <ol className="mt-8 grid gap-5 md:grid-cols-2">
            <Question
              n="01"
              q="What does it return?"
              why="So the model can tell whether it now has the answer, or still needs another call."
              example="…returns the status, the assigned gate, the departure time, and the tail number…"
            />
            <Question
              n="02"
              q="What does it identify things by?"
              why="This is the single highest value sentence you can write. A name can express what a tool does. It can never express what its argument should look like."
              example="…identified by its 3-letter IATA code (e.g. 'SFO')…"
            />
            <Question
              n="03"
              q="When should it be used?"
              why="Relevance is not obvious. A flight can look perfectly healthy and still be at risk for a reason that lives in a different tool."
              example="…use this whenever a question depends on conditions at the ORIGIN airport…"
            />
            <Question
              n="04"
              q="When should it NOT be used?"
              why="Tools sit next to near neighbours. Saying which one this is not is often faster than describing what it is."
              example="…this returns the gate a flight is assigned to. It does NOT find an empty gate…"
            />
          </ol>

          <div className="mt-8 rounded-lg border-l-2 border-navy bg-bg-secondary p-6">
            <p className="max-w-3xl text-[15px] leading-relaxed text-ink">
              Question 02 turned out to carry almost all the weight. Every
              failure this lab was able to reproduce came from an{" "}
              <strong>argument</strong>, not from picking the wrong tool. The
              name and the schema both reach the model, but an argument format
              is precisely the thing a well chosen function name cannot tell
              you. The full experiment behind that claim, all 36
              recorded runs of it, is in the repository.{" "}
              <Link
                href="/lab/good-tools-bad-tools"
                className="text-accent underline underline-offset-2 hover:text-accent-hover"
              >
                Watch it happen in the demo
              </Link>
              .
            </p>
          </div>
        </section>

        {/* 4. Where this sits */}
        <section className="border-t border-border py-14">
          <SectionLabel>04 · Why this is the whole game</SectionLabel>
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            Retrieval fails soft. Tools fail hard.
          </h2>
          <div className="mt-5 grid gap-8 md:grid-cols-2">
            <div className="space-y-4 text-[15.5px] leading-relaxed text-ink">
              <p>
                Grounding a model in retrieved documents is read only and fails
                gently. Fetch the wrong passage and you get a worse answer, but
                nothing in the world changes. Grounding it in{" "}
                <em>functions</em> is different in kind. The wrong tool, or the
                right tool with the wrong argument, does something.
              </p>
              <p>
                In this lab the worst case is a confusing answer, because every
                tool here only reads. In a system with write tools it is a
                cancelled booking or a reassigned gate. The error surface also
                compounds across steps, because each call&apos;s output becomes
                the next call&apos;s input.
              </p>
            </div>
            <div className="space-y-4 text-[15.5px] leading-relaxed text-ink">
              <p>
                Retrieval risk is about information quality. Tool calling risk is
                about information quality, action correctness, and sequencing.
              </p>
              <p>
                Which is why the interface between your code and the model
                deserves more care than a rushed sentence, and why the rest of
                this lab is spent measuring exactly what that sentence is worth.
              </p>
              <Link
                href="/lab/good-tools-bad-tools"
                className="inline-block rounded bg-navy px-5 py-2.5 text-[14.5px] text-white transition-opacity hover:opacity-90"
              >
                Run the demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Metric({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: "danger" | "accent";
}) {
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "accent"
        ? "text-accent"
        : "text-navy";
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className={`font-serif text-3xl ${color}`}>{value}</span>
        <span className="mt-1 block text-[13px] leading-snug text-muted">
          {label}
        </span>
      </dd>
    </div>
  );
}

function Question({
  n,
  q,
  why,
  example,
}: {
  n: string;
  q: string;
  why: string;
  example: string;
}) {
  return (
    <li className="rounded-lg border border-border bg-card p-6">
      <span className="section-label">{n}</span>
      <h3 className="font-serif text-xl text-navy">{q}</h3>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink">{why}</p>
      <p className="wire mt-4 rounded border border-border bg-bg-secondary p-3 text-muted">
        {example}
      </p>
    </li>
  );
}
