"use client";

import { useMemo, useState } from "react";
import FormattedText from "./FormattedText";
import type { Run } from "@/lib/traces";

/**
 * "The Wire". One recorded exchange, stepped through message by message,
 * showing the actual JSON that crossed between the model and the program.
 *
 * The step this component exists for is `execute`. Everything else on the
 * wire is text the model produced or text it was handed. In between sits a
 * step the model has no part in: your own process reading a request and
 * deciding to honour it. People assume the model runs their functions. It
 * cannot. It emits a name and some arguments, and something you wrote
 * chooses what to do about that. Which is where every safeguard in an
 * agentic system has to live.
 */

type Event =
  | { kind: "user"; text: string }
  | { kind: "assistant_text"; text: string; turn: number }
  | {
      kind: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
      turn: number;
    }
  | { kind: "execute"; name: string; input: Record<string, unknown> }
  | {
      kind: "tool_result";
      id: string;
      name: string;
      content: Record<string, unknown>;
    }
  | { kind: "final"; text: string };

function buildEvents(run: Run, question: string): Event[] {
  const events: Event[] = [{ kind: "user", text: question }];

  run.turns.forEach((turn, turnIdx) => {
    const isLast = turnIdx === run.turns.length - 1;

    for (const block of turn.assistant) {
      if (block.type === "text" && block.text.trim()) {
        if (isLast && turn.stop_reason !== "tool_use") {
          events.push({ kind: "final", text: block.text });
        } else {
          events.push({ kind: "assistant_text", text: block.text, turn: turnIdx });
        }
      } else if (block.type === "tool_use") {
        events.push({
          kind: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input,
          turn: turnIdx,
        });
        const result = turn.tool_results.find((r) => r.tool_use_id === block.id);
        events.push({ kind: "execute", name: block.name, input: block.input });
        if (result) {
          events.push({
            kind: "tool_result",
            id: result.tool_use_id,
            name: result.name,
            content: result.content,
          });
        }
      }
    }
  });

  return events;
}

export default function WireWalkthrough({
  run,
  question,
}: {
  run: Run;
  question: string;
}) {
  const events = useMemo(() => buildEvents(run, question), [run, question]);
  const [step, setStep] = useState(0);
  const shown = events.slice(0, step + 1);
  const atEnd = step >= events.length - 1;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-bg-secondary px-4 py-3">
        <span className="section-label !mb-0">
          Step {step + 1} of {events.length}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded border border-border bg-card px-3 py-1 text-[13px] text-ink transition-colors hover:border-muted disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={() => setStep((s) => Math.min(events.length - 1, s + 1))}
            disabled={atEnd}
            className="rounded bg-navy px-3 py-1 text-[13px] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {step === 0 ? "Start" : "Next"}
          </button>
          <button
            onClick={() => setStep(0)}
            className="rounded border border-border bg-card px-3 py-1 text-[13px] text-muted transition-colors hover:text-ink"
          >
            Reset
          </button>
        </div>
      </div>

      <ol className="divide-y divide-border">
        {shown.map((event, i) => (
          <li key={i} className={i === shown.length - 1 ? "bg-accent-light/35" : ""}>
            <EventRow event={event} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function EventRow({ event }: { event: Event }) {
  switch (event.kind) {
    case "user":
      return (
        <Row actor="Your user" tone="muted">
          <p className="text-[15px] text-ink">{event.text}</p>
        </Row>
      );

    case "assistant_text":
      return (
        <Row actor="Model → text" tone="muted">
          <p className="text-[14px] leading-relaxed text-ink">{event.text}</p>
        </Row>
      );

    case "tool_use":
      return (
        <Row actor="Model → tool_use" tone="indigo">
          <p className="mb-2 text-[13.5px] text-muted">
            The model does not run anything here. It emits a request, with an id
            your code must quote back.
          </p>
          <Json
            value={{
              type: "tool_use",
              id: event.id,
              name: event.name,
              input: event.input,
            }}
          />
        </Row>
      );

    case "execute":
      return (
        <Row actor="Your code runs" tone="gold">
          <p className="mb-2 text-[13.5px] text-muted">
            This step is entirely yours. Your loop looked up the name, chose to
            call it, and could just as easily have refused, logged it, or asked
            a human first.
          </p>
          <pre className="wire text-ink">
            {`${event.name}(${Object.entries(event.input)
              .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
              .join(", ")})`}
          </pre>
        </Row>
      );

    case "tool_result": {
      const failed = event.content.status === "error";
      return (
        <Row actor="Your code → tool_result" tone={failed ? "danger" : "accent"}>
          <p className="mb-2 text-[13.5px] text-muted">
            Handed back to the model as a normal message, matched to the request
            by <code className="font-mono">tool_use_id</code>.
            {failed && " This one failed, and the model has to deal with that."}
          </p>
          <Json
            value={{
              type: "tool_result",
              tool_use_id: event.id,
              content: event.content,
            }}
          />
        </Row>
      );
    }

    case "final":
      return (
        <Row actor="Model → final answer" tone="navy">
          <FormattedText
            text={event.text}
            className="text-[14.5px] leading-relaxed text-ink"
          />
        </Row>
      );
  }
}

const TONES: Record<string, string> = {
  muted: "text-muted",
  indigo: "text-indigo",
  gold: "text-gold",
  accent: "text-accent",
  danger: "text-danger",
  navy: "text-navy",
};

function Row({
  actor,
  tone,
  children,
}: {
  actor: string;
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-4">
      <span className={`section-label !mb-2 ${TONES[tone]}`}>{actor}</span>
      {children}
    </div>
  );
}

function Json({ value }: { value: unknown }) {
  return (
    <pre className="wire rounded border border-border bg-bg-secondary p-3 text-ink">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
