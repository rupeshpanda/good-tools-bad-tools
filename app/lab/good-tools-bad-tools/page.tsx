import type { Metadata } from "next";
import { Header, Footer } from "@/components/Chrome";
import LiveDemo from "@/components/LiveDemo";

export const metadata: Metadata = {
  title: "Good Tools, Bad Tools | Elegance AI",
  description:
    "Two AI agents, the same question, the same functions, the same model. Only the tool descriptions differ — and one of them gets it wrong without making a single error.",
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
            Two AI agents. Same question, same data, same model, same Python
            functions underneath. The only difference is the sentence describing
            what each tool does.
          </p>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink">
            Press the button and watch them disagree.
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
              title="A tool is just a function you wrote"
              body={[
                "Nothing about it is an AI concept. This agent has six ordinary Python functions that look up flights, gates, passengers, maintenance records, and airport weather. They worked before any model existed.",
                "What turns a function into a tool is that you also wrote a short description of it for the model to read. The model never sees your code — only that description. It is not documentation. It is the entire interface.",
              ]}
            />
            <Block
              n="02"
              title="The model doesn't run your code"
              body={[
                "When an agent 'calls a tool', it executes nothing. It emits a small block of JSON: a tool name and some arguments. That is the step 2 you just watched appear.",
                "Your own program reads that request and decides what to do — run it, refuse it, log it, or stop and ask a human. Every action an agent has ever taken was a line of someone's code choosing to comply.",
              ]}
            />
            <Block
              n="03"
              title="So the description decides everything"
              body={[
                "The model picks the tool and builds the arguments from your sentence alone. If it doesn't say the airport must be a three-letter code, you get 'Chicago'. If it doesn't say departure risk lives at the origin, you get the weather at the destination.",
                "A name can say what a tool does. It can never say what its argument should look like — which is exactly where these agents go wrong.",
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
              The uncomfortable part isn&apos;t that the lazy agent fails. It is
              that it fails <em>fluently</em>. It calls sensible tools in a
              sensible order, every call returns <code className="font-mono text-[14px]">ok</code>,
              and it produces a confident, well-organised answer. Nothing in the
              trace looks wrong, because nothing went wrong — the tool was simply
              asked about the wrong place.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              No error-rate dashboard catches that. No retry fires. A human
              reading the output cannot tell the difference, because both answers
              read like competent work. And when the tools stop merely reading
              data and start cancelling bookings or reassigning gates, that same
              gap between <em>succeeded</em> and <em>was correct</em> stops being
              a demo and starts being an incident.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              Which is why the least glamorous artefact in an agentic system — a
              sentence describing a function — deserves more care than it usually
              gets. It is not a comment. It is the contract.
            </p>

            <div className="mt-8 rounded-lg border border-border bg-bg-secondary p-6">
              <p className="text-[14.5px] leading-relaxed text-muted">
                Every run above is live, made when you pressed the button. The
                supporting figures quoted under the results come from 36 runs
                recorded earlier against the same code — all of them published,
                none selected, in{" "}
                <a
                  href="https://github.com/rupeshpanda/good-tools-bad-tools"
                  className="text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  the repo
                </a>
                , along with the five scenarios that were expected to break and
                didn&apos;t.
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
