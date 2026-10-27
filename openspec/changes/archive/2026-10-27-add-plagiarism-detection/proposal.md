## Why

Professors grading lesson exercises and running contests have no way to spot students handing in copied code: today they would have to open every submission and compare by eye. A MOSS-style similarity report, computed on demand from submissions already stored, surfaces suspicious pairs in seconds, with no schema change and no judge change.

## What Changes

- New pure TypeScript module `web/lib/similarity/` (no DB, no Next imports):
  - per-language tokenizer (c, cpp, java, rust, python, portugol) that drops comments and whitespace and normalizes identifiers and literals, so renaming variables or reformatting does not hide a copy;
  - k-gram hashing + winnowing (MOSS) fingerprints that keep source offsets;
  - pairwise comparison giving a similarity % and the matched source ranges on both sides.
- New professor-only server actions:
  - `getExerciseSimilarity(exerciseId, { pick })` — owner of the exercise's lesson only;
  - `getContestProblemSimilarity(contestId, problemId, { pick })` — contest owner only.
  Both pick one submission per student (`latest` or `best`), compare every pair of students that used the same language, and return pairs sorted by similarity plus each picked submission's code. Nothing is stored.
- New professor-only pages:
  - `/classes/[classSlug]/lessons/[lessonSlug]/exercises/[exerciseSlug]/similarity`;
  - `/contests/[slug]/similarity` (problem picker in the URL).
  Each lists suspicious pairs with similarity %, a latest/best toggle and a threshold, and opens a side-by-side code view with the matched regions highlighted.
- Entry links from the professor's existing views (lesson review / exercise page for the owner, contest manage tab).
- i18n strings in `messages/br.json` and `messages/en.json`.

## Capabilities

### New Capabilities
- `code-similarity`: MOSS-style fingerprinting and pairwise similarity of student submissions per exercise / contest problem, the professor-only actions that serve it, and the report + side-by-side view.

### Modified Capabilities
<!-- none: no existing requirement changes -->

## Impact

- New: `web/lib/similarity/*` (+ `*.test.ts` run by `bun test lib`), `web/lib/actions/similarity/*`, `web/hooks/use-*-similarity.tsx` (queries only), two new pages and their components, i18n keys.
- Touched (small, additive): professor entry points in `app/[locale]/classes/_components/` and `app/[locale]/contests/_components/tabs/management`.
- No migration, no change to `submission` enums, no change to `judge/`, gradebook export or CI.
- Cost: O(n²) pair comparisons per request; fine for class/contest sizes (tens to low hundreds of students). The actions cap the number of compared submissions.
