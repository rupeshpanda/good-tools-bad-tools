"use client";

import { useState } from "react";
import FormattedText from "./FormattedText";
import { VARIANTS } from "@/lib/live/schemas";

/**
 * The whole demo: one question, two agents, side by side.
 *
 * Each panel shows the same three steps, because those three steps ARE tool
 * calling: what the model was told the tool does, the call it constructed
 * from that, and the answer it reached. The only thing that differs between
 * the panels is step one.
 */

interface Step {
  tool: string;
  input: Record<string, string>;
  result: { status: string; [k: string]: unknown };
  toolUseId: string;
}

interface Run {
  steps: Step[];
  answer: string;
  errorCount: number;
  elapsedMs: number;
  hitLimit: boolean;
}

type PanelState =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "done"; run: Run }
  | { phase: "failed"; message: string };

const PRESETS = [
  {
    label: "Should I worry about this passenger's flight?",
    question: "Should I be worried about James Okafor's flight?",
    /** Only set where we have recorded evidence for this exact question. */
    focusTool: "get_weather",
    recorded:
      "In 3 of 3 recorded runs, the lazy agent checked the weather at JFK — the destination — instead of SFO, where the aircraft actually takes off.",
    watch: "Watch which airport each one checks the weather for.",
  },
  {
    label: "Move a flight to another gate",
    question: "AA118 needs to be moved to a different gate in Terminal 2. Which one?",
    focusTool: "find_available_gate",
    recorded:
      "In 3 of 3 recorded runs, the lazy agent guessed 'Terminal 2' and then '2' before finding 'T2' — and in one run it never got there at all.",
    watch: "Watch how each one writes the terminal name.",
  },
  {
    label: "Will a flight get out of Chicago?",
    question: "Will UA455 make it out of Chicago tonight?",
    focusTool: "get_weather",
    recorded:
      "In 3 of 3 recorded runs, the lazy agent passed 'Chicago' to a tool that only accepts airport codes, wasting a call before recovering.",
    watch: "Watch what each one passes as the airport.",
  },
];

export default function LiveDemo() {
  const [question, setQuestion] = useState(PRESETS[0].question);
  const [preset, setPreset] = useState<(typeof PRESETS)[number] | null>(
    PRESETS[0],
  );
  const [lazyState, setLazyState] = useState<PanelState>({ phase: "idle" });
  const [completeState, setCompleteState] = useState<PanelState>({ phase: "idle" });
  const [error, setError] = useState<string | null>(null);

  const loading =
    lazyState.phase === "running" || completeState.phase === "running";

  const choose = (p: (typeof PRESETS)[number]) => {
    setQuestion(p.question);
    setPreset(p);
    setLazyState({ phase: "idle" });
    setCompleteState({ phase: "idle" });
    setError(null);
  };

  // Both variants are fired at once but awaited separately, so whichever
  // finishes first renders first. The lazy agent usually wins that race,
  // which is its own small lesson: it stops asking sooner.
  const run = () => {
    setError(null);
    const fire = async (
      variant: "lazy" | "complete",
      set: (s: PanelState) => void,
    ) => {
      set({ phase: "running" });
      try {
        const res = await fetch("/api/lab/good-tools-bad-tools/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, variant }),
        });
        const data = await res.json();
        if (!res.ok) {
          set({ phase: "failed", message: data.error ?? "Something went wrong." });
          setError(data.error ?? "Something went wrong.");
        } else {
          set({ phase: "done", run: data.run });
        }
      } catch {
        const message = "Could not reach the demo. Check your connection.";
        set({ phase: "failed", message });
        setError(message);
      }
    };
    void fire("lazy", setLazyState);
    void fire("complete", setCompleteState);
  };

  const bothDone =
    lazyState.phase === "done" && completeState.phase === "done";

  const focusTool = focusToolFor(
    lazyState,
    completeState,
    preset?.focusTool ?? "get_weather",
  );

  // Generated from the two transcripts so the callout can never contradict
  // what the visitor is looking at.
  const verdict =
    lazyState.phase === "done" && completeState.phase === "done"
      ? diagnose(lazyState.run, completeState.run)
      : null;

  return (
    <div>
      {/* Ask */}
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <label
          htmlFor="q"
          className="section-label"
        >
          Ask the airline operations agent
        </label>

        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.question}
              onClick={() => choose(p)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                question === p.question
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-muted hover:border-muted hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          id="q"
          value={question}
          rows={2}
          maxLength={200}
          onChange={(e) => {
            setQuestion(e.target.value);
            setPreset(null);
          }}
          placeholder="…or ask your own question about flights, gates, passengers, aircraft, or airport weather."
          className="w-full resize-none rounded border border-border bg-bg-secondary px-3.5 py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted focus:border-accent"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={run}
            disabled={loading || !question.trim()}
            className="rounded bg-accent px-6 py-2.5 text-[15px] font-medium text-white transition-opacity hover:bg-accent-hover disabled:opacity-45"
          >
            {loading ? "Running both agents…" : "Run both agents"}
          </button>
          <span className="text-[13px] text-muted">
            One question. Two agents. The only difference is how their tools
            are described.
          </span>
        </div>

        {error && (
          <p className="mt-4 rounded border border-danger/30 bg-danger-bg/40 px-3.5 py-3 text-[14px] text-danger">
            {error}
          </p>
        )}
      </div>

      {preset && lazyState.phase === "idle" && !loading && (
        <p className="mt-4 text-center text-[14px] text-muted">{preset.watch}</p>
      )}

      {/* Compare */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel
          kind="lazy"
          state={lazyState}
          tool={focusTool}
          description={describe("lazy", focusTool)}
        />
        <Panel
          kind="complete"
          state={completeState}
          tool={focusTool}
          description={describe("complete", focusTool)}
        />
      </div>

      {bothDone && verdict && (
        <div
          className={`mt-5 rounded-lg border-l-2 px-5 py-4 ${
            verdict.tone === "level"
              ? "border-navy bg-bg-secondary"
              : "border-gold bg-warning-bg/25"
          }`}
        >
          <p className="text-[14.5px] leading-relaxed text-ink">
            {verdict.headline}
          </p>
          {preset?.recorded && (
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              {preset.recorded}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Which tool's description to show in step 1.
 *
 * The interesting tool is the one whose argument the two agents disagree
 * about — that is where a description earns its keep. Failing that, the last
 * tool called (agents tend to save the decisive lookup for last), and failing
 * that, the preset's nominated tool.
 */
function focusToolFor(
  lazy: PanelState,
  complete: PanelState,
  fallback: string,
): string {
  if (lazy.phase === "done" && complete.phase === "done") {
    for (const step of lazy.run.steps) {
      const twin = complete.run.steps.find((s) => s.tool === step.tool);
      if (twin && JSON.stringify(twin.input) !== JSON.stringify(step.input)) {
        return step.tool;
      }
    }
  }
  const done = lazy.phase === "done" ? lazy : complete.phase === "done" ? complete : null;
  if (done && done.run.steps.length) {
    return done.run.steps[done.run.steps.length - 1].tool;
  }
  return fallback;
}

function describe(variant: "lazy" | "complete", tool: string): string {
  const found = VARIANTS[variant].find((t) => t.name === tool);
  return found?.description ?? "";
}

/**
 * Describes what actually happened in THIS run.
 *
 * The demo is live, so the lazy agent does not fail identically every time —
 * sometimes it makes a wrong call and recovers, sometimes it gets there
 * cleanly. Hard-coding "the lazy one checked the wrong airport" would
 * eventually contradict what is on screen, so the callout is generated from
 * the two transcripts instead, and the recorded figures are appended as
 * context rather than as the claim.
 */
function diagnose(lazy: Run, complete: Run): { headline: string; tone: "bad" | "mixed" | "level" } {
  const completeArgs = new Set(
    complete.steps.map((s) => `${s.tool}:${JSON.stringify(s.input)}`),
  );
  const strayed = lazy.steps.filter(
    (s) => !completeArgs.has(`${s.tool}:${JSON.stringify(s.input)}`),
  );

  if (lazy.errorCount > 0) {
    const failed = lazy.steps.filter((s) => s.result.status === "error");
    const first = failed[0];
    return {
      tone: "bad",
      headline: `This run, the lazy agent called ${first.tool} with ${JSON.stringify(
        Object.values(first.input)[0],
      )} and it failed — ${lazy.errorCount} failed call${
        lazy.errorCount === 1 ? "" : "s"
      } in total. The careful agent made none.`,
    };
  }

  if (strayed.length) {
    const s = strayed[0];
    const extra =
      lazy.steps.length > complete.steps.length
        ? ` It took ${lazy.steps.length} calls to the careful agent's ${complete.steps.length}.`
        : "";
    return {
      tone: "mixed",
      headline:
        `This run, the lazy agent called ${s.tool} with ${JSON.stringify(
          Object.values(s.input)[0],
        )} — something the careful agent never asked for.${extra}`,
    };
  }

  return {
    tone: "level",
    headline:
      "This run, both agents made exactly the same calls. That happens — the failure is unreliable, not constant, which is worse than broken because it survives the one test you ran before shipping.",
  };
}

function Panel({
  kind,
  state,
  tool,
  description,
}: {
  kind: "lazy" | "complete";
  state: PanelState;
  tool: string;
  description: string;
}) {
  const lazy = kind === "lazy";
  const loading = state.phase === "running";
  const run = state.phase === "done" ? state.run : null;

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-lg border ${
        lazy ? "border-danger/35" : "border-success/35"
      }`}
    >
      <div className={`px-5 py-3.5 ${lazy ? "bg-danger-bg/45" : "bg-success-bg/45"}`}>
        <h3
          className={`font-serif text-lg ${lazy ? "text-danger" : "text-success"}`}
        >
          {lazy ? "Lazy tool description" : "Careful tool description"}
        </h3>
      </div>

      {/* 1 — what the model was told */}
      <Step
        n="1"
        title={
          <>
            What the model was told{" "}
            <code className="font-mono normal-case">{tool}</code> does
          </>
        }
      >
        <p
          className={`wire rounded border p-3 ${
            lazy
              ? "border-danger/25 bg-danger-bg/20 text-danger"
              : "border-border bg-bg-secondary text-ink"
          }`}
        >
          {description}
        </p>
        <p className="mt-2 text-[13px] text-muted">
          This sentence is the entire interface. The model never sees the code
          behind it.
        </p>
      </Step>

      {/* 2 — the call it built */}
      <Step n="2" title="The tool call it constructed">
        {loading && <Skeleton />}
        {!loading && !run && <Waiting />}
        {run && (
          <>
            <ol className="space-y-2">
              {run.steps.map((s, i) => (
                <li key={i}>
                  <pre className="wire rounded border border-border bg-bg-secondary p-3 text-ink">
                    {JSON.stringify(
                      { type: "tool_use", name: s.tool, input: s.input },
                      null,
                      2,
                    )}
                  </pre>
                  <p
                    className={`mt-1.5 flex items-center gap-2 text-[12.5px] ${
                      s.result.status === "error" ? "text-danger" : "text-muted"
                    }`}
                  >
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase ${
                        s.result.status === "error"
                          ? "bg-danger-bg text-danger"
                          : "bg-success-bg text-success"
                      }`}
                    >
                      {s.result.status === "error" ? "err" : "ok"}
                    </span>
                    your code ran it and returned the result
                  </p>
                </li>
              ))}
              {run.steps.length === 0 && (
                <li className="text-[13.5px] text-muted">
                  It called no tools at all.
                </li>
              )}
            </ol>
            <p className="mt-2 text-[13px] text-muted">
              The model didn&apos;t run anything. It produced this JSON; your
              program chose to execute it.
            </p>
          </>
        )}
      </Step>

      {/* 3 — the answer */}
      <Step n="3" title="The answer it gave" last>
        {loading && <Skeleton />}
        {!loading && !run && <Waiting />}
        {run &&
          (run.answer ? (
            <FormattedText
              text={run.answer}
              className="text-[14px] leading-relaxed text-ink"
            />
          ) : (
            <p className="text-[14px] italic text-danger">
              It ran out of attempts without answering.
            </p>
          ))}
      </Step>
    </div>
  );
}

function Step({
  n,
  title,
  children,
  last,
}: {
  n: string;
  title: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "px-5 py-4" : "border-b border-border px-5 py-4"}>
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className="font-mono text-[12px] text-muted">{n}</span>
        <span className="section-label !mb-0">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2" aria-label="Running">
      <div className="h-3 w-3/4 animate-pulse rounded bg-bg-secondary" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-bg-secondary" />
    </div>
  );
}

function Waiting() {
  return <p className="text-[13.5px] text-muted">Waiting for a run.</p>;
}
