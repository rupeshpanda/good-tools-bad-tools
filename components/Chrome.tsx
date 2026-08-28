const SITE = "https://eleganceai.ai";
const REPO = "https://github.com/rupeshpanda/good-tools-bad-tools";

export function Header({ current }: { current?: "lab" | "guide" }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-sm">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3.5 text-sm"
      >
        <a
          href={SITE}
          className="font-serif text-base text-navy transition-colors hover:text-accent"
        >
          Elegance&nbsp;AI
        </a>
        <a
          href={`${SITE}/lab`}
          className="text-muted transition-colors hover:text-ink"
        >
          Lab
        </a>
        <span className="ml-auto flex items-center gap-5">
          {current === "guide" && (
            <a
              href="/lab/good-tools-bad-tools"
              className="text-muted transition-colors hover:text-ink"
            >
              ← Back to the demo
            </a>
          )}
          <a href={REPO} className="text-muted transition-colors hover:text-ink">
            Source ↗
          </a>
        </span>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-8 border-t border-border">
      <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-muted">
        <p className="mb-3 max-w-3xl">
          Synthetic data only — no real airline, aircraft, or passenger is
          represented. Runs are made live against{" "}
          <code className="font-mono text-[12.5px] text-ink">
            claude-sonnet-4-5
          </code>{" "}
          when you press the button.
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-2">
          <a href={SITE} className="transition-colors hover:text-ink">
            eleganceai.ai
          </a>
          <a href={`${SITE}/lab`} className="transition-colors hover:text-ink">
            More labs
          </a>
          <a href={REPO} className="transition-colors hover:text-ink">
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
