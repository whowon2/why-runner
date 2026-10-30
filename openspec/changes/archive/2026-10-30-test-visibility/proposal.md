## Why

The classroom test on 2026-10-29 exposed two bugs in how test cases are shown on lesson exercises. A failing exercise submission never shows its report (input, expected, actual, or the hidden-test notice), only the code. The exercise page's "Test cases" card also lists every test's input, so hidden tests are not hidden in lessons. The underlying model makes this hard to fix cleanly: `problem.exampleCount` only allows "the first N tests are public", and `lesson.showOutputs` is a second, overlapping rule that only covers expected outputs. The two are applied in different places (`getExercise` masks outputs, `redactFailure` has an exercise branch). Professors also want to pick which tests are examples, not only how many.

## What Changes

- **BREAKING (schema)**: replace `problem.exampleCount` with a per-test `problem.visible boolean[]`, parallel to `inputs`/`outputs`. A missing entry means hidden. Migration `0050`: a test at index `< exampleCount` becomes `visible = true`, then `example_count` is dropped.
- **BREAKING (schema)**: replace `lesson.showOutputs` with an enum `lesson.testVisibility` (`problem_default` | `show_all` | `hide_all`, default `problem_default`). Same migration: `showOutputs = true` becomes `show_all` and `false` becomes `problem_default`, then `show_outputs` is dropped.
- Problem editor: each test gets an "Example (visible to students)" checkbox. The "Examples shown" number field goes away. New tests (manual or AI-suggested edge cases) start hidden.
- One pure visibility rule in `lib/judge-report.ts` decides, for a viewer and a test index, whether that test is visible. Both the exercise "Test cases" card (server-side, in `getExercise`) and failing-test redaction (`redactReport`) use it. A visible test shows input, expected and actual. A hidden test shows only "Test N failed (hidden)" with the pass counts. Compiler output is still shown. Class owners, lesson owners and problem authors always see everything.
- The exercise page's "Test cases" card lists only the tests the viewer may see and says how many are hidden. `getExercise` stops sending hidden inputs and outputs to the client.
- Exercise submissions render the failing-test report by reusing `SubmissionDetails` / `HiddenTestNotice` from the contest and problem views.
- Lesson settings: the "Show expected outputs" switch becomes a 3-option segmented control. It uses the existing optimistic `useUpdateLesson` mutation, which already has narrow invalidation.
- Problem import: the `visible` array is accepted. The legacy `exampleCount` is still accepted and converted to `visible`, so the existing `problems.json` keeps importing. Setting both is an error.
- Seeds and readers that use `exampleCount` move to `visible`: `get-problem`, `get-problem-tests`, `get-problems`, `export-contest`, `redactSubmission`, `seed-lessons.ts` and `docs/presentation/seed_v4.py`.
- The judge does not change. It never reads `example_count` (`judge/src/db.rs` selects explicit columns), and lesson visibility is a read-time concern only.

## Capabilities

### New Capabilities
- `test-case-visibility`: per-test `visible` flag, the lesson-level `testVisibility` mode, the single visibility rule and who bypasses it, the problem-editor checkbox, the exercise "Test cases" card, and the lesson-settings control.

### Modified Capabilities
- `submission-feedback-visibility`: "sample test" now means a test with `visible = true`, not `index ≤ exampleCount`. The lesson-exercise rule changes from "input always shown, expected only if `showOutputs`" to the shared rule under the lesson's `testVisibility`. Exercise submissions must render the report.
- `lesson-grading`: "Exercise page shows declared test-case inputs" and "Lesson-level toggle controls test-case output visibility" are replaced by the `testVisibility` mode.
- `problem-import`: `exampleCount` is replaced by `visible` in the accepted payload, with legacy conversion.
- `server-action-security`: the `updateProblem` allowlist swaps `exampleCount` for `visible`.
- `problem-workspace`: the Tests tab's "sample test cases" are the tests marked visible, labelled with their original test numbers.

## Impact

- **DB**: migration `web/drizzle/migrations/0050_test_visibility.sql` with a journal and snapshot entry. `feat/signup-ra` owns 0049 and `feat/roles-coteachers` owns 0051, so ordering and the shared dev DB need coordination (see design).
- **Schema**: `web/drizzle/schemas/problems.ts`, `web/drizzle/schemas/lessons.ts` (new `test_visibility` pg enum).
- **Server**: `lib/judge-report.ts` (+ tests), `lib/actions/lessons/{get-exercise,get-exercise-submissions,update-lesson}.ts`, `lib/actions/problems/{get-problem,get-problem-tests,get-problems,update-problem,import-problems}.ts`, `lib/actions/contest/export-contest.ts`, `lib/problem-import/schema.ts` (+ tests).
- **UI**: `classes/_components/exercise-detail.tsx`, `classes/_components/manage-lesson.tsx`, `problems/_components/create.tsx`, `problems/_components/import.tsx`, `contests/_components/tabs/problem/submission-list.tsx` (`SubmissionDetails` moves to a shared component), a new `components/ui/toggle-group.tsx`, and `hooks/use-update-lesson.tsx`.
- **i18n**: `messages/en.json` and `messages/br.json` (new keys, plus removal of `showOutputs*` and `examplesShown`).
- **Data/seeds**: `problems.json` (optional rewrite to `visible`), `drizzle/seed-lessons.ts`, `docs/presentation/seed_v4.py`.
- **Not affected**: `judge/` and the AI hint prompt input. `getAIHelp` still reads the raw report server-side, and that is a separate concern.
