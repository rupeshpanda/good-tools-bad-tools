import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import LiveDemo from "@/components/LiveDemo";

const DESCRIPTION =
  "Two agents. The same question, the same functions, the same model. Only the wording of the tool declarations differs, and it changes what they do.";

export const metadata: Metadata = {
  title: "Good Tools, Bad Tools | Elegance AI",
  description: DESCRIPTION,
  openGraph: {
    title: "Good Tools, Bad Tools",
    description: DESCRIPTION,
    url: "/lab/good-tools-bad-tools",
  },
  twitter: { card: "summary_large_image", description: DESCRIPTION },
};

export default function LabPage() {
  return (
    <>
      <Header current="lab" />

      <main className="mx-auto w-full max-w-5xl px-5">
        {/* Hook */}
        <section className="pt-14 pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="tag-badge">Tool calling</span>
            <span className="tag-badge">Agents</span>
            <span className="tag-badge">Live demo</span>
          </div>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight text-navy md:text-5xl">
            Good Tools, Bad Tools
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink">
            Two agents. The same question. The same data, the same model, the
            same functions underneath. The only thing that differs is how those
            tools are described to the model.
          </p>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink">
            In the recorded runs, one of them tells an operations officer not
            to worry about a flight that is sitting under fog. It makes no
            errors doing it.
          </p>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink">
            Press the button and watch their execution diverge.
          </p>
        </section>

        {/* The demo */}
        <section className="pb-14">
          <LiveDemo />
        </section>

        {/* Explainer */}
        <section className="border-t border-border py-14">
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">
            What just happened
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Block
              n="01"
              title="A tool is something you already built"
              body={[
                "There is nothing about a tool that is an AI concept. A tool wraps whatever you point it at: an API call, a database query, an MCP operation, a step in a workflow. In this lab they happen to be six ordinary Python functions that read flight, gate, passenger, maintenance, and weather records. They worked before any model existed and they would keep working if you deleted the model tomorrow.",
                "What turns that code into a tool is the declaration you write alongside it: a name, a description, and a schema for the parameters. The model never sees the code. It sees the declaration and nothing else. This is not documentation. It is the interface.",
              ]}
            />
            <Block
              n="02"
              title="The model does not run your code"
              body={[
                "When an agent calls a tool, it executes nothing. It returns a small block of JSON containing a tool name and some arguments. That is the second step you watched appear above.",
                "Your own program reads that request and decides what to do with it. Run it. Refuse it. Log it. Stop and ask a human first. Every action an agent has ever taken was a line of somebody's code choosing to comply.",
              ]}
            />
            <Block
              n="03"
              title="So the declaration decides the outcome"
              body={[
                "The model chooses the tool and builds the arguments from the declaration alone. If nothing in it says that the airport must be a three letter code, you get Chicago. If nothing says that departure risk lives at the origin, you get the weather at the destination.",
                "The name and the schema both carry signal, but the prose is where most of it lives. A name can tell the model what a tool does. It can never tell the model what the argument should look like. That is where these agents go wrong.",
              ]}
            />
          </div>
        </section>

        {/* Why it matters */}
        <section className="border-t border-border py-14">
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl leading-snug text-navy">
              Why this matters more than it looks
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-ink">
              The lazy agent does not fail loudly. That is the problem with it.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              It calls sensible tools in a sensible order. Every call returns{" "}
              <code className="font-mono text-[14px]">ok</code>. It produces a
              confident, well organised answer. Nothing in the trace looks wrong,
              because nothing went wrong. The tool was simply asked about the
              wrong place.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              No error rate dashboard catches this. No retry fires. A human
              reading the output cannot tell the two apart, because both answers
              read like competent work.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              Every tool in this lab only reads data, so the worst case here is a
              misleading answer. When the same agent cancels a booking or
              reassigns a gate, the distance between succeeded and was correct
              stops being a demonstration and becomes an incident.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              The least glamorous artefact in an agentic system is the sentence
              describing what a tool does. It is not a comment. It is the
              contract.
            </p>

            <p className="mt-6 text-[15px] leading-relaxed text-ink">
              If you want the mechanism in more detail, including the exact JSON
              that crosses the wire,{" "}
              <Link
                href="/lab/good-tools-bad-tools/guide"
                className="text-accent underline underline-offset-2 hover:text-accent-hover"
              >
                read the guide
              </Link>
              .
            </p>

            <div className="mt-8 rounded-lg border border-border bg-bg-secondary p-6">
              <p className="text-[14.5px] leading-relaxed text-muted">
                Every run above is live. It is made when you press the button.
                The supporting figures quoted underneath the results come from 36
                runs recorded earlier against the same code. All of them are
                published and none were selected, in{" "}
                <a
                  href="https://github.com/rupeshpanda/good-tools-bad-tools"
                  className="text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  the repository
                </a>
                , alongside the five scenarios that were expected to break and
                did not.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Block({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string[];
}) {
  return (
    <div>
      <span className="section-label">{n}</span>
      <h3 className="font-serif text-xl leading-snug text-navy">{title}</h3>
      {body.map((p, i) => (
        <p key={i} className="mt-3 text-[14.5px] leading-relaxed text-ink">
          {p}
        </p>
      ))}
    </div>
  );
}
