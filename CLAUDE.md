@AGENTS.md

# Good Tools, Bad Tools

Elegance AI lab. Built 2026-08-27 and 2026-08-28.

**Live:** https://eleganceai.ai/lab/good-tools-bad-tools
**Deployment:** https://good-tools-bad-tools.vercel.app/lab/good-tools-bad-tools
**Repository:** https://github.com/rupeshpanda/good-tools-bad-tools

## Status

Shipped and listed on the main site. Live demo working against
`claude-sonnet-4-5-20250929`. `ANTHROPIC_API_KEY` is set in Vercel production.
Mobile verified at 320px and 390px. Social card generated and rendering.

## Stack

Next.js 16 App Router, React 19, Tailwind v4, TypeScript. DM Serif Display for
headings, Inter for body, JetBrains Mono for wire format. The Elegance AI
palette is copied into `app/globals.css` so the lab reads as one system with
eleganceai.ai even though it deploys separately. Deployed as its own Vercel
project under the `rupesh-s-eleganceai` team, the same pattern as the other
labs. Listed on the main site by an entry in `components/LabIndex.tsx` of
`rupeshpanda/elegance-ai`, whose default branch is `master`.

## Where it came from

The agent is the FlightOps project, originally an assignment build. All
assignment framing was stripped and the data was moved from an India context
to a US one so the audience can connect with it.

## The experiment

A tool declaration gives the model two channels: the name and the prose.
Comparing one good schema against one bad one changes both at once, so each is
varied independently as a 2x2. Verified over 3 scenarios, 4 variants, 3 runs.

| Variant      | Correct | Meaning                                    |
| ------------ | ------- | ------------------------------------------ |
| `complete`   | 9/9     | real names, complete descriptions          |
| `prose_only` | 9/9     | names stripped to `tool_a` through `tool_f` |
| `nothing`    | 7/9     | names stripped, lazy descriptions          |
| `lazy`       | 5/9     | real names, lazy descriptions              |

Findings that held. The prose carries the signal and the name carries almost
none. Every failure by a named agent was a wrong argument rather than a wrong
tool choice; only 2 runs out of 36 reached for an irrelevant tool and both were
in the nameless variant. The worst failure produced no errors at all: in
`wrong-airport` the lazy agent checked weather at the destination instead of
the departure airport, three runs out of three, with `status: ok` throughout.

## Decisions worth remembering

**Empirical scenario selection.** Five candidate scenarios were designed to
provoke wrong-tool selection and produced no difference at all. Candidates were
swept before any were committed to. The null result is published rather than
buried, and it is what pointed the lab at arguments instead of tool choice.

**Live rather than recorded, but hedged.** The first build replayed recorded
traces. Rupesh asked for live runs. Live reintroduces the risk that a
probabilistic failure fails to reproduce in front of an audience, so the page
generates its summary from the two transcripts it just produced.

**Simplicity over completeness.** The first site presented the full 2x2, four
findings, a token meter, and a separate guide page. It was rejected as too much
information. The lesson generalises: ship one interaction and three short
explanation blocks, and keep the depth in the repository. The guide was deleted
and then restored as a quiet second page.

**Two accuracy errors caught in review.** The copy said "watch them disagree"
when the lazy agent often reaches a similar conclusion by a worse route, and it
said the model sees only the description when it sees the whole declaration.
Both are now fixed and both are rules in `AGENTS.md`.

## Next steps

- Consider a global daily spend cap. The rate limit is in memory and therefore
  per serverless instance, so it is weaker than it appears.
- The "break it yourself" slider was scoped and never built. It would let a
  visitor move a description between vague, adequate, and complete and watch
  the outcome change.
- The `n=3` sample is enough to show a difference and far too few to measure
  one. A larger run would settle whether `lazy` really scores worse than
  `nothing`, which is observed but explicitly not claimed on the site.
