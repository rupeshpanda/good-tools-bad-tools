"use client";

import { useState } from "react";
import FormattedText from "./FormattedText";

/**
 * The blind test.
 *
 * Two final answers, unlabelled, from two agents given identical questions,
 * identical data, and identical functions. One checked the departure airport.
 * One checked the destination. The reader is asked to pick before being told.
 *
 * Almost nobody can, and that is the finding. Fluency is not evidence. If the
 * only review step in your pipeline is a human reading the output, this is
 * the failure that walks straight past it.
 */
export default function BlindTest({
  answerA,
  answerB,
  correct,
  prompt,
  revealNote,
}: {
  answerA: string;
  answerB: string;
  /** Which panel came from the complete-schema agent. */
  correct: "A" | "B";
  prompt: string;
  revealNote: string;
}) {
  const [picked, setPicked] = useState<"A" | "B" | null>(null);
  const revealed = picked !== null;
  const gotIt = picked === correct;

  return (
    <div>
      <p className="mb-5 text-[15px] leading-relaxed text-ink">{prompt}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {(["A", "B"] as const).map((key) => {
          const isCorrect = key === correct;
          const answer = key === "A" ? answerA : answerB;
          return (
            <button
              key={key}
              onClick={() => !revealed && setPicked(key)}
              disabled={revealed}
              aria-pressed={picked === key}
              className={`rounded-lg border p-5 text-left transition-colors ${
                revealed
                  ? isCorrect
                    ? "border-success bg-success-bg/40"
                    : "border-danger bg-danger-bg/40"
                  : "border-border bg-card hover:border-accent cursor-pointer"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="section-label !mb-0">Agent {key}</span>
                {revealed && (
                  <span
                    className={`text-[12px] font-semibold uppercase tracking-wide ${
                      isCorrect ? "text-success" : "text-danger"
                    }`}
                  >
                    {isCorrect ? "Checked the origin" : "Checked the destination"}
                  </span>
                )}
              </div>
              <FormattedText
                text={answer}
                className="text-[14px] leading-relaxed text-ink"
              />
            </button>
          );
        })}
      </div>

      {!revealed && (
        <p className="mt-4 text-[13.5px] text-muted">
          Pick one. There is no penalty for guessing — that is rather the point.
        </p>
      )}

      {revealed && (
        <div className="mt-5 rounded-lg border border-border bg-bg-secondary p-5">
          <p className="mb-2 font-serif text-lg text-navy">
            {gotIt
              ? "You picked correctly — now ask how."
              : "That is the one that had it wrong."}
          </p>
          <p className="text-[14.5px] leading-relaxed text-ink">{revealNote}</p>
        </div>
      )}
    </div>
  );
}
