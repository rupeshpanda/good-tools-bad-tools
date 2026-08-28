"use client";

import { useState } from "react";
import type { WallTool } from "@/lib/wall";

/**
 * "The Wall" — the central idea of the lab, made physical.
 *
 * Left: the Python function you wrote. Right: the tool declaration, which is
 * the only thing the model ever receives. The blind toggle removes the left
 * panel entirely, because that is the model's actual field of view — it has
 * never seen your code, cannot infer it, and will not notice if the prose
 * describing it is wrong.
 */
export default function TheWall({
  tools,
  totals,
}: {
  tools: WallTool[];
  totals: { pythonLines: number; completeChars: number; lazyChars: number };
}) {
  const [selected, setSelected] = useState(tools[0].name);
  const [lazy, setLazy] = useState(false);
  const [blind, setBlind] = useState(false);

  const tool = tools.find((t) => t.name === selected)!;
  const schema = lazy ? tool.lazy : tool.complete;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg-secondary px-4 py-3">
        <div
          role="tablist"
          aria-label="Choose a tool"
          className="flex flex-wrap gap-1.5"
        >
          {tools.map((t) => (
            <button
              key={t.name}
              role="tab"
              aria-selected={t.name === selected}
              onClick={() => setSelected(t.name)}
              className={`rounded-full px-3 py-1 font-mono text-[11.5px] transition-colors ${
                t.name === selected
                  ? "bg-navy text-white"
                  : "bg-card text-muted border border-border hover:text-ink"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4 text-[13px]">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={lazy}
              onChange={(e) => setLazy(e.target.checked)}
              className="accent-[var(--danger)]"
            />
            <span className={lazy ? "text-danger font-medium" : "text-muted"}>
              Lazy description
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={blind}
              onChange={(e) => setBlind(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span className={blind ? "text-accent font-medium" : "text-muted"}>
              Show the model&apos;s view
            </span>
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        {/* Left: your code */}
        <div className="relative min-w-0 border-b border-border md:border-b-0 md:border-r">
          <PanelHeading
            kicker="You wrote this"
            title={`tools.py · ${tool.python_lines} lines`}
          />
          <pre className="wire max-h-[22rem] overflow-auto px-4 pb-4 text-ink">
            {tool.python_source}
          </pre>

          {blind && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy/95 px-8 text-center backdrop-blur-[3px]">
              <div>
                <p className="font-serif text-xl text-white">
                  The model has never seen this.
                </p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
                  Not the function body, not the docstring, not the data it
                  reads. It cannot check whether the sentence on the right is
                  true.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: what the model sees */}
        <div className="min-w-0">
          <PanelHeading
            kicker="The model sees only this"
            title={`tool declaration · ${schema.description.length} characters`}
            tone={lazy ? "danger" : "accent"}
          />
          <pre className="wire max-h-[22rem] overflow-auto px-4 pb-4 text-ink">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </div>

      <div className="rule-top bg-bg-secondary px-4 py-3 text-[13px] leading-relaxed text-muted">
        Across all six tools: <strong className="text-ink">{totals.pythonLines} lines</strong>{" "}
        of Python, none of it visible to the model — against{" "}
        <strong className="text-ink">
          {lazy ? totals.lazyChars : totals.completeChars} characters
        </strong>{" "}
        of prose, which is the entire interface.{" "}
        {lazy && (
          <span className="text-danger">
            The lazy set describes {totals.pythonLines} lines of behaviour in{" "}
            {totals.lazyChars} characters.
          </span>
        )}
      </div>
    </div>
  );
}

function PanelHeading({
  kicker,
  title,
  tone = "muted",
}: {
  kicker: string;
  title: string;
  tone?: "muted" | "accent" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "accent"
        ? "text-accent"
        : "text-muted";
  return (
    <div className="px-4 pt-4 pb-2">
      <span className={`section-label !mb-1 ${toneClass}`}>{kicker}</span>
      <p className="font-mono text-[12px] text-muted">{title}</p>
    </div>
  );
}
