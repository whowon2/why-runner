## Context

Submissions live in one `submission` table: lesson exercise answers carry `exerciseId`, contest answers carry `contestId` + `problemId`. Professors own lessons (`lesson.createdBy`) and contests (`contest.createdBy`). Server actions follow `web/CLAUDE.md`: auth with `getCurrentUser`, zod-parsed input, owner check, `publicUserColumns`, never leak `output` unredacted. Pure modules under `web/lib` are unit-tested with `bun test lib`. Other worktrees own the judge, status enums, gradebook export and CI, and migration 0048 — this change must touch none of them.

## Goals / Non-Goals

**Goals:**
- MOSS-style detection robust to renaming, reformatting and comments.
- On-demand computation from existing rows; no storage, no migration.
- Side-by-side view with paired highlighted regions.

**Non-Goals:**
- Cross-exercise / cross-contest / internet comparison.
- Detecting AI-generated code or semantic clones (reordered statements, different algorithms).
- Storing verdicts or flags, notifying students, auto-penalties.
- Comparing across languages.

## Decisions

### Module layout (`web/lib/similarity/`, pure TS)
- `tokenize.ts` — `tokenize(code, language) → Token[]` where `Token = { t: string; start: number; end: number }`. One hand-written scanner driven by a per-language config (`languages.ts`): line-comment prefixes, block-comment delimiters, string delimiters (incl. Python triple quotes, Rust raw strings basic `r"…"`/`r#"…"#`, char literals), keyword set, and "skip-line" prefixes (`#` preprocessor for c/cpp, `import`/`package` for java). Identifiers → `"V"`, numbers → `"N"`, strings/chars → `"S"`, keywords/operators kept verbatim (operators matched greedily from a list of multi-char ops, else single char). Python `#` is a comment; Portugol uses `//` and `/* */` and its own keywords (`programa`, `funcao`, `inteiro`, `se`, `senao`, `enquanto`, `para`, `escreva`, `leia`, …). Built-in I/O names (`printf`, `print`, `scanf`, `cin`) are just identifiers → `V`: fine, the boilerplate filter handles the shared skeleton.
- `fingerprint.ts` — `kgramHashes(tokens, k)` (32-bit FNV-1a over the k token strings joined, via `Math.imul`), `winnow(hashes, w)` → `{ hash, pos }[]` (pos = k-gram start token index). Deterministic, no randomness.
- `compare.ts` — `comparePair(a, b, { k, ignore })`: index B's fingerprints by hash; for each A fingerprint with a non-ignored shared hash, every (i, j) pair is a seed; extend forward while `a.tokens[i+n].t === b.tokens[j+n].t` (also backward to the previous unmatched token, so seeds that land mid-run still cover the run). Sort candidates by length desc (tie: i, then j), accept when no token on either side is already marked. Discard < k. Return `{ similarity, coverageA, coverageB, regions: { a: [startChar, endChar], b: [startChar, endChar] }[] }` with regions sorted by A position.
  - Alternative considered: Jaccard over fingerprint sets. Rejected: gives no regions and under-weights long matches; tiling gives both % and regions from one pass.
- `report.ts` — `buildSimilarityReport(entries, opts)` where entry = `{ id, studentId, language, code }`: tokenize + fingerprint each once, count per-hash document frequency, build the ignore set (share > 0.5 when ≥ 4 entries), compare each same-language pair of different students, sort by similarity desc, cap pairs.
- `pick.ts` — `pickPerStudent(submissions, mode)`: implements latest/best, skips PENDING/RUNNING, uses `computeExerciseScore` for the passed fraction.
- Defaults `k = 5`, `w = 4` (guaranteed detection of 8-token runs). Student programs are short (30–300 tokens), so a small k matters more than noise; the boilerplate filter and the `≥ k` region floor keep noise down.

### Server actions (`web/lib/actions/similarity/`)
- `get-exercise-similarity.ts` and `get-contest-problem-similarity.ts`, `"use server"`, each: `getCurrentUser` → zod parse → owner check (throw `Forbidden`-style errors like siblings) → load submissions with explicit `columns` (no `output` except to compute `best` — loaded server-side and dropped before return) → `pickPerStudent` → cap 300 → `buildSimilarityReport` → `ok({ ..., submissions: Record<id, { id, user, language, status, createdAt, code }>, pairs, truncated })`.
- Students' user rows via `with: { user: { columns: publicUserColumns } }`.
- Parsons exercise → `fail("PARSONS_NOT_SUPPORTED")`. Blocks exercises are compared on their generated Portugol code.
- Shared tail (pick → report → shape) in a server-only helper `web/lib/similarity/server.ts`? No: keep the pure pipeline in `report.ts` and do the small shaping in each action; avoids another file importing DB.

### Hooks
`hooks/use-exercise-similarity.tsx`, `hooks/use-contest-problem-similarity.tsx`: `useQuery` with keys `["exercises", id, "similarity", pick]` and `["contests", id, "similarity", problemId, pick]`, `unwrap` + `retryUnlessActionError`, like `useLessonReview`. No mutations, so no invalidation entries are needed; the keys sit under the existing `exercises`/`contests` prefixes so any future submission mutation invalidating those prefixes also refreshes reports.

### Pages & components
- `app/[locale]/classes/[classSlug]/lessons/[lessonSlug]/exercises/[exerciseSlug]/similarity/page.tsx` and `app/[locale]/contests/[slug]/similarity/page.tsx`: server pages, `requireOnboardedUser`, resolve id by slug, `notFound()` when the viewer is not the owner (the action enforces again). Follow the `creating-a-page` skill for header/spacing.
- Shared client components in `components/similarity/`: `similarity-report.tsx` (toggle, threshold slider, pair table, selection via `nuqs` `pair`, `pick`, `min`), `side-by-side.tsx` (two `<pre>` columns, code split into segments by region ranges, region i colored from a fixed palette with hover linking both sides, click a region to scroll the other side to it).
- Entry points: a "Similarity" icon button next to the existing owner dialogs in `lesson-roadmap.tsx`'s exercise rows; a link card/button in the contest `management` tab.

## Risks / Trade-offs

- [False positives on short/trivial problems — everyone's correct answer looks alike] → boilerplate filter, per-side %, the professor reads the code; UI copy says the score is a hint, not a verdict.
- [O(n²) compare on large contests] → 300-submission cap; each compare is linear-ish in tokens; ~45k pairs × few hundred tokens is well under a second in V8.
- [Tokenizer edge cases (nested Rust block comments, Python f-strings, C++ raw strings)] → handled approximately; a mis-lexed literal only shifts tokens locally and both sides are lexed the same way.
- [Leaking hidden-test data] → actions never return `output`.

## Migration Plan

None. Pure additive code; revert by removing files and the two entry links.

## Open Questions

- None blocking. Threshold default for the list: 50%.
