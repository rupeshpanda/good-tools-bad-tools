"use client";

import { useState } from "react";
import FormattedText from "./FormattedText";
import {
  judgeRun,
  variantScore,
  firstTurnInputTokens,
  VARIANT_ORDER,
  type Scenario,
  type VariantKey,
  type Run,
  type ToolCall,
} from "@/lib/types";

/**
 * The experiment itself.
 *
 * Primary view is the comparison the lab is named for: the same question,
 * the same functions, the same data, run against a lazy schema and a complete
 * one. Underneath sits the full 2x2, which is what stops the primary view
 * from being a just-so story — anonymising the tool names is the control that
 * shows the description, and not the name, is doing the work.
 *
 * Every recorded run is shown. None are hidden, and none are chosen.
 */
export default function Experiment({ scenarios }: { scenarios: Scenario[] }) {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const scenario = scenarios.find((s) => s.id === scenarioId)!;
  const [runIndex, setRunIndex] = useState(0);

  const runCount = scenario.variants.complete.runs.length;

  return (
    <div>
      {/* Scenario picker */}
      <div
        role="tablist"
        aria-label="Scenario"
        className="mb-6 flex flex-wrap gap-2"
      >
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === scenarioId}
            onClick={() => {
              setScenarioId(s.id);
              setRunIndex(0);
            }}
            className={`rounded-lg border px-4 py-2.5 text-left transition-colors ${
              s.id === scenarioId
                ? "border-navy bg-navy text-white"
                : "border-border bg-card hover:border-muted"
            }`}
          >
            <span
              className={`block text-[11px] font-semibold uppercase tracking-wider ${
                s.id === scenarioId ? "text-white/60" : "text-muted"
              }`}
            >
              {i + 1}. {s.failure_mode}
            </span>
            <span className="text-[14px]">{s.title}</span>
          </button>
        ))}
      </div>

      {/* The question */}
      <div className="mb-6 rounded-lg border border-border bg-bg-secondary p-5">
        <span className="section-label">The operator asks</span>
        <p className="font-serif text-xl text-navy">
          &ldquo;{scenario.question}&rdquo;
        </p>
        <p className="mt-4 border-t border-border pt-4 text-[14px] leading-relaxed text-ink">
          <strong>The right answer is:</strong> {scenario.ground_truth.answer}
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          {scenario.ground_truth.why}
        </p>
      </div>

      {/* Run selector */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="section-label !mb-0">Recorded run</span>
        <div className="flex gap-1.5">
          {Array.from({ length: runCount }, (_, i) => (
            <button
              key={i}
              onClick={() => setRunIndex(i)}
              aria-pressed={i === runIndex}
              className={`rounded border px-3 py-1 font-mono text-[12.5px] transition-colors ${
                i === runIndex
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-muted hover:text-ink"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <span className="text-[13px] text-muted">
          Same question, re-run {runCount} times against each schema.
        </span>
      </div>

      {/* Head to head */}
      <div className="grid gap-5 lg:grid-cols-2">
        <VariantPanel scenario={scenario} variant="lazy" runIndex={runIndex} />
        <VariantPanel scenario={scenario} variant="complete" runIndex={runIndex} />
      </div>

      {/* What it costs */}
      <div className="mt-6 rounded-lg border-l-2 border-gold bg-warning-bg/30 p-5">
        <span className="section-label !text-gold">What this costs you</span>
        <p className="text-[14.5px] leading-relaxed text-ink">{scenario.cost}</p>
      </div>

      {/* The 2x2 control */}
      <AblationGrid scenario={scenario} />
    </div>
  );
}

/* ------------------------------------------------------------------ panels */

function VariantPanel({
  scenario,
  variant,
  runIndex,
}: {
  scenario: Scenario;
  variant: VariantKey;
  runIndex: number;
}) {
  const meta = scenario.variant_meta[variant];
  const run = scenario.variants[variant].runs[runIndex];
  const verdict = judgeRun(run, scenario.ground_truth);
  const isLazy = meta.description_channel === "lazy";

  // The tool whose description differs most between variants — shown so the
  // reader can see the exact prose that produced the behaviour below it.
  const focusTool = scenario.ground_truth.required_tools.slice(-1)[0];
  const schema = scenario.variants[variant].schemas.find(
    (s) => s.name === focusTool || s.name.startsWith("tool_"),
  );

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-lg border ${
        isLazy ? "border-danger/35" : "border-success/35"
      }`}
    >
      <div
        className={`px-5 py-3 ${isLazy ? "bg-danger-bg/50" : "bg-success-bg/50"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-[13px] font-semibold uppercase tracking-wider ${
              isLazy ? "text-danger" : "text-success"
            }`}
          >
            {meta.label} description
          </span>
          <VerdictBadge verdict={verdict} />
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink/75">
          {meta.blurb}
        </p>
      </div>

      {schema && (
        <div className="border-b border-border px-5 py-4">
          <span className="section-label">
            What the model was told about{" "}
            <code className="font-mono normal-case">{focusTool}</code>
          </span>
          <p
            className={`wire rounded border p-3 ${
              isLazy
                ? "border-danger/25 bg-danger-bg/20"
                : "border-border bg-bg-secondary"
            }`}
          >
            {schema.description}
          </p>
        </div>
      )}

      <div className="px-5 py-4">
        <span className="section-label">
          Tool calls it made ({run.tool_calls.length})
        </span>
        <ol className="space-y-1.5">
          {run.tool_calls.map((call, i) => (
            <CallRow key={i} call={call} />
          ))}
          {run.tool_calls.length === 0 && (
            <li className="text-[13.5px] text-muted">No tools called.</li>
          )}
        </ol>
      </div>

      <div className="border-t border-border px-5 py-4">
        <span className="section-label">Answer given to the operator</span>
        {run.final_answer ? (
          <FormattedText
            text={run.final_answer}
            className="text-[14px] leading-relaxed text-ink"
          />
        ) : (
          <p className="text-[14px] italic text-danger">
            The agent ran out of tool-call budget without answering.
          </p>
        )}
      </div>

      <div className="rule-top flex flex-wrap gap-x-5 gap-y-1 bg-bg-secondary px-5 py-3 font-mono text-[12px] text-muted">
        <span>{run.tool_calls.length} calls</span>
        <span className={verdict.errorCount ? "text-danger" : ""}>
          {verdict.errorCount} errors
        </span>
        <span>{firstTurnInputTokens(run)} input tokens / turn</span>
        <span>{(run.elapsed_ms / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

function CallRow({ call }: { call: ToolCall }) {
  const failed = call.result.status === "error";
  const args = Object.entries(call.input)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(", ");
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-[3px] shrink-0 rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase ${
          failed ? "bg-danger-bg text-danger" : "bg-success-bg text-success"
        }`}
      >
        {failed ? "err" : "ok"}
      </span>
      <code className="wire block !text-[12.5px] leading-snug text-ink">
        {call.resolved}({args})
      </code>
    </li>
  );
}

function VerdictBadge({ verdict }: { verdict: ReturnType<typeof judgeRun> }) {
  if (verdict.correct) {
    return (
      <span className="shrink-0 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
        Correct
      </span>
    );
  }
  // The distinction the whole lab turns on: did it fail loudly, or quietly?
  const silent = verdict.succeeded;
  return (
    <span
      title={verdict.reasons.join("; ")}
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white ${
        silent ? "bg-navy" : "bg-danger"
      }`}
    >
      {silent ? "Wrong, no error" : "Wrong"}
    </span>
  );
}

/* -------------------------------------------------------------- 2x2 control */

function AblationGrid({ scenario }: { scenario: Scenario }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span>
          <span className="section-label !mb-1">The control</span>
          <span className="text-[15px] text-ink">
            Was it really the description — or just the tool&apos;s name?
          </span>
        </span>
        <span className="shrink-0 text-muted">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5">
          <p className="mb-5 max-w-2xl text-[14px] leading-relaxed text-muted">
            A declaration gives the model two channels: the tool&apos;s{" "}
            <strong className="text-ink">name</strong> and its{" "}
            <strong className="text-ink">description</strong>. Comparing one
            good schema against one bad one changes both at once. So each
            channel is varied independently — the names in the bottom row are
            stripped to <code className="font-mono">tool_a</code>…
            <code className="font-mono">tool_f</code>, with cross-references
            inside the prose rewritten so nothing leaks.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-[13.5px]">
              <thead>
                <tr>
                  <th className="w-32 border-b border-border p-2 text-left font-medium text-muted" />
                  <th className="border-b border-border p-2 text-left font-medium text-muted">
                    Complete description
                  </th>
                  <th className="border-b border-border p-2 text-left font-medium text-muted">
                    Lazy description
                  </th>
                </tr>
              </thead>
              <tbody>
                <GridRow
                  scenario={scenario}
                  label="Real names"
                  cells={["complete", "lazy"]}
                />
                <GridRow
                  scenario={scenario}
                  label="Names stripped"
                  cells={["prose_only", "nothing"]}
                />
              </tbody>
            </table>
          </div>

          <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-ink">
            Read it down the columns rather than across. The columns hold; the
            rows barely matter. Taking every tool&apos;s name away costs close
            to nothing so long as the description is intact — and no amount of
            helpful naming rescues a description that isn&apos;t.
          </p>
        </div>
      )}
    </div>
  );
}

function GridRow({
  scenario,
  label,
  cells,
}: {
  scenario: Scenario;
  label: string;
  cells: VariantKey[];
}) {
  return (
    <tr>
      <th className="border-b border-border p-2 text-left align-top font-medium text-ink">
        {label}
      </th>
      {cells.map((variant) => {
        const score = variantScore(scenario, variant);
        const good = score.correct === score.total;
        return (
          <td key={variant} className="border-b border-border p-2 align-top">
            <div className="flex items-center gap-1.5">
              {score.verdicts.map((v, i) => (
                <span
                  key={i}
                  title={v.correct ? "correct" : v.reasons.join("; ")}
                  className={`inline-block h-3 w-6 rounded-sm ${
                    v.correct
                      ? "bg-success"
                      : v.succeeded
                        ? "bg-navy"
                        : "bg-danger"
                  }`}
                />
              ))}
              <span
                className={`ml-1.5 font-mono text-[12px] ${
                  good ? "text-success" : "text-danger"
                }`}
              >
                {score.correct}/{score.total}
              </span>
            </div>
            <p className="mt-1.5 font-mono text-[11.5px] text-muted">
              {score.totalCalls} calls · {score.totalErrors} errors
            </p>
          </td>
        );
      })}
    </tr>
  );
}

/** Exported for the reliability legend on the page. */
export function VerdictLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-muted">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-6 rounded-sm bg-success" /> correct
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-6 rounded-sm bg-navy" /> wrong, but
        every call returned ok
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-6 rounded-sm bg-danger" /> wrong,
        with visible errors
      </span>
    </div>
  );
}

export function TokenNote({ scenario }: { scenario: Scenario }) {
  const complete = firstTurnInputTokens(scenario.variants.complete.runs[0]);
  const lazy = firstTurnInputTokens(scenario.variants.lazy.runs[0]);
  const delta = complete - lazy;
  const pct = Math.round((delta / lazy) * 100);

  return (
    <Run2Note complete={complete} lazy={lazy} delta={delta} pct={pct} />
  );
}

function Run2Note({
  complete,
  lazy,
  delta,
  pct,
}: {
  complete: number;
  lazy: number;
  delta: number;
  pct: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <span className="section-label">What the good descriptions cost</span>
      <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-3">
        <Stat label="Lazy schemas" value={lazy} unit="input tokens" />
        <Stat label="Complete schemas" value={complete} unit="input tokens" />
        <Stat
          label="Difference"
          value={`+${delta}`}
          unit={`+${pct}% per turn`}
          tone="gold"
        />
      </div>
      <p className="max-w-2xl text-[14px] leading-relaxed text-ink">
        Worth being straight about: thorough descriptions are not free. The
        entire tool block is re-sent on{" "}
        <strong>every turn of every conversation</strong>, so that difference is
        paid again on each round trip, forever — not once at build time.
      </p>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
        It is still the cheaper option here. The lazy runs spend their savings
        immediately on retries — extra turns that each re-send the whole tool
        block anyway — and buy a wrong answer with them.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number | string;
  unit: string;
  tone?: "gold";
}) {
  return (
    <div>
      <span className="section-label !mb-0.5">{label}</span>
      <span
        className={`font-serif text-3xl ${tone === "gold" ? "text-gold" : "text-navy"}`}
      >
        {value}
      </span>
      <span className="ml-1.5 text-[13px] text-muted">{unit}</span>
    </div>
  );
}
