/**
 * Shapes and scoring for the recorded agent transcripts, kept free of any
 * node: imports so client components can use them too. The filesystem
 * loaders live in ./traces.
 *
 * The transcripts themselves are produced by agent/record.py against the real
 * Anthropic API and committed to the repo. Nothing on this site calls a model
 * at runtime: the failures being demonstrated are probabilistic, so a live run
 * could accidentally succeed and quietly contradict the page illustrating it.
 * Recording them once, and shipping every run rather than a chosen one, is the
 * honest way to show a probabilistic difference.
 */

export type VariantKey = "complete" | "lazy" | "prose_only" | "nothing";

export const VARIANT_ORDER: VariantKey[] = [
  "complete",
  "lazy",
  "prose_only",
  "nothing",
];

export interface ToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
}

export interface ToolCall {
  /** The name the model asked for — `tool_f` in the opaque variants. */
  name: string;
  /** The Python function that actually ran. Comparable across variants. */
  resolved: string;
  input: Record<string, unknown>;
  result: { status: "ok" | "error"; [key: string]: unknown };
}

export type AssistantBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

export interface Turn {
  index: number;
  stop_reason: string;
  assistant: AssistantBlock[];
  tool_results: {
    tool_use_id: string;
    name: string;
    content: Record<string, unknown>;
  }[];
  usage: { input_tokens: number; output_tokens: number };
}

export interface Run {
  run: number;
  final_answer: string | null;
  turns: Turn[];
  tool_calls: ToolCall[];
  hit_iteration_limit: boolean;
  elapsed_ms: number;
}

export interface VariantMeta {
  label: string;
  name_channel: "descriptive" | "opaque";
  description_channel: "complete" | "lazy";
  blurb: string;
}

export interface GroundTruth {
  answer: string;
  why: string;
  required_tools: string[];
  forbidden_tools?: string[];
  required_arguments?: Record<string, Record<string, string>>;
}

export interface Scenario {
  id: string;
  title: string;
  question: string;
  failure_mode: string;
  severity: number;
  teaches: string;
  cost: string;
  ground_truth: GroundTruth;
  model: string;
  system_prompt: string;
  recorded_at: string;
  runs_per_variant: number;
  variant_meta: Record<VariantKey, VariantMeta>;
  variants: Record<VariantKey, { schemas: ToolSchema[]; runs: Run[] }>;
}

/* ---------------------------------------------------------------------------
   Verdicts
   ---------------------------------------------------------------------------
   A run is judged on two independent axes, because the whole point of this
   lab is that they come apart. `succeeded` asks whether the machinery worked
   — did every tool call return ok. `correct` asks whether the agent actually
   answered the question — did it call the required tools with the required
   arguments.

   The `wrong-airport` scenario is the case that matters: succeeded = true,
   correct = false. Every call returns ok and the answer is still wrong. Any
   monitoring that only watches for errors will report that run as healthy.
   --------------------------------------------------------------------------- */

export interface Verdict {
  succeeded: boolean;
  correct: boolean;
  errorCount: number;
  callCount: number;
  reasons: string[];
}

export function judgeRun(run: Run, truth: GroundTruth): Verdict {
  const reasons: string[] = [];
  const errorCount = run.tool_calls.filter(
    (c) => c.result.status === "error",
  ).length;
  const called = new Set(run.tool_calls.map((c) => c.resolved));

  for (const tool of truth.required_tools) {
    if (!called.has(tool)) reasons.push(`never called ${tool}`);
  }
  for (const tool of truth.forbidden_tools ?? []) {
    if (called.has(tool)) reasons.push(`called ${tool}, which answers a different question`);
  }

  for (const [tool, args] of Object.entries(truth.required_arguments ?? {})) {
    for (const [arg, expected] of Object.entries(args)) {
      const matched = run.tool_calls.some(
        (c) =>
          c.resolved === tool &&
          String(c.input[arg] ?? "").toUpperCase() === expected.toUpperCase() &&
          c.result.status === "ok",
      );
      if (!matched) {
        reasons.push(`never reached ${tool}(${arg}: "${expected}")`);
      }
    }
  }

  if (run.hit_iteration_limit) reasons.push("ran out of tool-call budget");
  if (run.final_answer === null) reasons.push("produced no answer");

  return {
    succeeded: errorCount === 0 && !run.hit_iteration_limit,
    correct: reasons.length === 0,
    errorCount,
    callCount: run.tool_calls.length,
    reasons,
  };
}

/** How many of a variant's runs were correct, for the reliability strip. */
export function variantScore(scenario: Scenario, variant: VariantKey) {
  const runs = scenario.variants[variant].runs;
  const verdicts = runs.map((r) => judgeRun(r, scenario.ground_truth));
  return {
    verdicts,
    correct: verdicts.filter((v) => v.correct).length,
    total: verdicts.length,
    /** Runs that failed while every tool call returned ok — the silent ones. */
    silentlyWrong: verdicts.filter((v) => !v.correct && v.succeeded).length,
    totalCalls: verdicts.reduce((n, v) => n + v.callCount, 0),
    totalErrors: verdicts.reduce((n, v) => n + v.errorCount, 0),
  };
}

/**
 * Input tokens spent on the first request of a run.
 *
 * Worth surfacing because the tool schemas are re-sent on every turn: a
 * thorough description is not paid for once, it is paid for on each round
 * trip, in every conversation, forever. That is the real cost side of the
 * argument this lab is making, and pretending it is free would be dishonest.
 */
export function firstTurnInputTokens(run: Run): number {
  return run.turns[0]?.usage.input_tokens ?? 0;
}
