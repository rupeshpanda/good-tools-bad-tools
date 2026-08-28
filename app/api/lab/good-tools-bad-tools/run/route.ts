import { NextResponse } from "next/server";
import { runVariant } from "@/lib/live/run";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_QUESTION_CHARS = 200;

/**
 * Runs one question against ONE tool schema and returns that transcript.
 *
 * The page fires two of these in parallel, one per variant, so each panel
 * fills the moment its own run finishes rather than both waiting on the
 * slower one. The lazy agent usually answers first. It asks fewer questions
 * before being sure. Which is worth seeing happen.
 */

/**
 * A crude relevance gate. This endpoint is a public button that spends the
 * site owner's API budget, so it only answers questions that plausibly
 * concern the fictional airline it has tools for. It is a cost control, not
 * a security boundary. The real protections are the rate limit, the length
 * cap, and the fact that every tool here is read-only over hard-coded data.
 */
const DOMAIN_HINTS = [
  "flight", "aa118", "aa119", "ua455", "dl290", "b6712", "gate", "terminal",
  "weather", "fog", "delay", "depart", "arrive", "aircraft", "plane",
  "maintenance", "tail", "passenger", "seat", "booking", "airport",
  "sfo", "jfk", "ord", "lax", "den", "atl", "bos", "mco",
  "okafor", "delgado", "chen", "whitfield", "reilly",
  "on time", "airline", "runway", "boarding", "a320", "b738", "a321",
];

function looksRelevant(q: string): boolean {
  const lower = q.toLowerCase();
  return DOMAIN_HINTS.some((hint) => lower.includes(hint));
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The live demo is not configured on this deployment." },
      { status: 503 },
    );
  }

  const limit = rateLimit(clientIp(req));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `That is a lot of runs in a short time. Try again in ${limit.retryAfterSec}s.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let question: unknown;
  let variant: unknown;
  try {
    ({ question, variant } = await req.json());
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (variant !== "lazy" && variant !== "complete") {
    return NextResponse.json({ error: "Unknown variant." }, { status: 400 });
  }

  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Ask something first." }, { status: 400 });
  }

  const trimmed = question.trim().slice(0, MAX_QUESTION_CHARS);

  if (!looksRelevant(trimmed)) {
    return NextResponse.json(
      {
        error:
          "This agent only has tools for one fictional airline. flights, gates, " +
          "passengers, aircraft maintenance, and airport weather. Try asking " +
          "about one of those.",
      },
      { status: 400 },
    );
  }

  try {
    const run = await runVariant(trimmed, variant, apiKey);
    return NextResponse.json({ question: trimmed, run });
  } catch (e) {
    console.error("live run failed", e);
    return NextResponse.json(
      { error: "The model call failed. Try again in a moment." },
      { status: 502 },
    );
  }
}
