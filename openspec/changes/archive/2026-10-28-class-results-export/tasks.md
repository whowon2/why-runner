## 1. Pure core

- [x] 1.1 Add `parseTestCounts(output)` → `{ passed, total } | null` to `web/lib/exercise-score.ts` and re-express `computeExerciseScore` through it (same results for all existing inputs)
- [x] 1.2 Create `web/lib/class-results.ts` with input/row types and `buildClassResults(...)`: student × published exercise cross product, ordering (student name/username, lesson order, exercise order), lesson state (`not_submitted`/`on_time`/`late`), graded snapshot columns, score via `computeExerciseScore`, activity defaults (0 / empty / false)
- [x] 1.3 Add `classResultsToCsv(rows)` using `toCsv` and `formatScore`, header per design decision 7, ISO timestamps, `YYYY-MM-DD` due dates, `true`/`false` booleans
- [x] 1.4 Write `web/lib/class-results.test.ts`: row count incl. no-activity pairs, unpublished excluded by input, late/on_time/no-due-date, handed-in-without-snapshot → score 0 and empty verdict, not-submitted → empty graded columns, activity with lesson not submitted, score equals `buildGradebook` cell for same input, CSV quoting of feedback with `"` and newline, formula prefix, header-only output
- [x] 1.5 Add `parseTestCounts` cases to the existing score tests (or new `exercise-score.test.ts`); run `bun test lib` green

## 2. Server side

- [x] 2.1 Extract the fetch in `getClassGradebook` into server-only `web/lib/classes/load-class-results-data.ts` (published lessons with exercises + problem code/title, students excluding owner with public columns, lesson submissions with `submittedAt`/`reviewedAt`, completions with `feedback` and submission `status/output/language/createdAt`)
- [x] 2.2 Switch `getClassGradebook` to the helper; confirm its returned shape is unchanged (no `output` or new fields leak to the client)
- [x] 2.3 Add the grouped activity query (count, max `created_at`, `bool_or(status = 'PASSED')` by user × exercise, filtered on both id lists, skipped when either list is empty)
- [x] 2.4 Create `web/lib/actions/classes/export-class-results.ts` (`"use server"`): zod uuid, `getCurrentUser`, `assertClassOwner`, load data + activity, return `ok({ filename, csv })` with `<slug>-results-<YYYY-MM-DD>.csv`

## 3. UI

- [x] 3.1 Replace the gradebook export `Button` in `class-gradebook.tsx` with a `DropdownMenu`: "Scores" (existing `gradebookToCsv` path) and "Detailed results" (calls action, pending/disabled state, `sonner` toast on error, Blob download)
- [x] 3.2 Add `ClassesPage` strings to `web/messages/en.json` and `pt.json` (menu items + short descriptions, error toast)

## 4. Verification

- [x] 4.1 `bun lint` and `bun test lib` pass in `web/`
- [ ] 4.2 Browser check on the worktree's `DEV_PORT` as `teacher@email.com`: both menu items download; detailed CSV opens in a spreadsheet with correct accents, row count = students × exercises, scores match the gradebook
- [ ] 4.3 As `user@email.com`, calling `exportClassResults` for that class is rejected and the gradebook entry point stays hidden
