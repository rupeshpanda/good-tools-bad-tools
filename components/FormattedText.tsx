import React from "react";

/**
 * Minimal renderer for the model's own answers.
 *
 * The transcripts are stored exactly as the model produced them, markdown and
 * all — rewriting them would undermine the point of publishing raw recordings.
 * So the markdown is rendered here at display time instead: bold, bullets, and
 * paragraph breaks, which is everything these answers actually use.
 *
 * Deliberately not a full markdown library. Answers come from a recorded file
 * in this repo, but rendering model output as raw HTML is a habit worth not
 * forming — this only ever emits text nodes and <strong>.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split on **bold** while keeping the delimiters' contents.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
}

export default function FormattedText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-2 space-y-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="select-none text-muted">
              ·
            </span>
            <span>{renderInline(b, `li-${blocks.length}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flushBullets();
    if (!line.trim()) return;
    blocks.push(
      <p key={`p-${i}`} className="my-2 first:mt-0 last:mb-0">
        {renderInline(line, `p-${i}`)}
      </p>,
    );
  });
  flushBullets();

  return <div className={className}>{blocks}</div>;
}
