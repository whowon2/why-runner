## 1. Similarity engine (pure TS, TDD)

- [x] 1.1 `web/lib/similarity/languages.ts`: per-language lexer configs (comments, strings, keywords, skip-line prefixes, operators) for c, cpp, java, python, portugol, rust
- [x] 1.2 `web/lib/similarity/tokenize.ts` + tests: comments/whitespace dropped, identifiers/numbers/strings normalized, offsets kept, preprocessor/import lines skipped
- [x] 1.3 `web/lib/similarity/fingerprint.ts` + tests: k-gram hashing, winnowing (rightmost min, guarantee threshold), tiny programs
- [x] 1.4 `web/lib/similarity/compare.ts` + tests: identical = 1, renamed/reformatted = 1, partial copy coverages, symmetry, regions ≥ k, char ranges map back to source
- [x] 1.5 `web/lib/similarity/report.ts` + tests: same-language pairing only, different students only, boilerplate filter, sorting, pair cap
- [x] 1.6 `web/lib/similarity/pick.ts` + tests: latest/best, skip PENDING/RUNNING, best fallback by passed fraction
- [x] 1.7 `bun test lib` green

## 2. Server actions

- [x] 2.1 `web/lib/actions/similarity/get-exercise-similarity.ts`: auth, zod, lesson-owner check, parsons failure, explicit columns, publicUserColumns, no `output` returned, caps + truncated flag
- [x] 2.2 `web/lib/actions/similarity/get-contest-problem-similarity.ts`: auth, zod, contest-owner + problem-in-contest checks, same shaping

## 3. Hooks

- [x] 3.1 Check `mutation-cache-invalidation` skill (queries only here; confirm nothing to invalidate)
- [x] 3.2 `hooks/use-exercise-similarity.tsx`, `hooks/use-contest-problem-similarity.tsx`

## 4. UI

- [x] 4.1 Follow `creating-a-page` skill; `components/similarity/side-by-side.tsx` (paired region colors, hover/click linking)
- [x] 4.2 `components/similarity/similarity-report.tsx` (pick toggle, threshold, pair list, empty state, truncation notice; URL state via nuqs)
- [x] 4.3 Exercise similarity page under `.../exercises/[exerciseSlug]/similarity`
- [x] 4.4 Contest similarity page `/contests/[slug]/similarity` with problem picker
- [x] 4.5 Entry links: lesson roadmap exercise rows (owner), contest management tab
- [x] 4.6 i18n keys in `messages/br.json` and `messages/en.json`

## 5. Verify

- [x] 5.1 `bun lint`, `bunx tsc --noEmit`, `bun test lib`
- [ ] 5.2 Manual check in dev (`bun dev -p $DEV_PORT`): owner sees report, student gets not-found (DB-level smoke of query + report done; browser check needs an owner login)
