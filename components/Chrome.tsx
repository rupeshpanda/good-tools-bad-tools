import Link from "next/link";

const SITE = "https://eleganceai.ai";

export function Header({ current }: { current: "lab" | "guide" }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-sm">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3.5 text-sm"
      >
        <a
          href={SITE}
          className="font-serif text-base text-navy hover:text-accent transition-colors"
        >
          Elegance&nbsp;AI
        </a>
        <a
          href={`${SITE}/lab`}
          className="text-muted hover:text-ink transition-colors"
        >
          Lab
        </a>
        <span className="ml-auto flex items-center gap-5">
          <Link
            href="/lab/good-tools-bad-tools/guide"
            aria-current={current === "guide" ? "page" : undefined}
            className={
              current === "guide"
                ? "text-ink font-medium"
                : "text-muted hover:text-ink transition-colors"
            }
          >
            Guide
          </Link>
          <Link
            href="/lab/good-tools-bad-tools"
            aria-current={current === "lab" ? "page" : undefined}
            className={
              current === "lab"
                ? "text-ink font-medium"
                : "text-muted hover:text-ink transition-colors"
            }
          >
            Experiment
          </Link>
        </span>
      </nav>
    </header>
  );
}

export function Footer({ model, recordedAt }: { model: string; recordedAt: string }) {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-muted">
        <p className="mb-3">
          Synthetic data only. No real airline, aircraft, or passenger is
          represented. Every transcript on this page is a recording of an actual
          run against{" "}
          <code className="font-mono text-[12.5px] text-ink">{model}</code>,
          captured {recordedAt.slice(0, 10)} by{" "}
          <code className="font-mono text-[12.5px] text-ink">agent/record.py</code>.
          Nothing here calls a model at request time.
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-2">
          <a href={SITE} className="hover:text-ink transition-colors">
            eleganceai.ai
          </a>
          <a href={`${SITE}/lab`} className="hover:text-ink transition-colors">
            More labs
          </a>
          <a
            href="https://github.com/rupeshpanda/good-tools-bad-tools"
            className="hover:text-ink transition-colors"
          >
            Source on GitHub ↗
          </a>
        </p>
      </div>
    </footer>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="section-label">{children}</span>;
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-6 ${className}`}
    >
      {children}
    </div>
  );
}
