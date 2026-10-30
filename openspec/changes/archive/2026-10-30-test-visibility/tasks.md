## 1. Schema and migration 0050

- [x] 1.1 Check migration numbering: confirm 0049 (`feat/signup-ra`) and 0051 (`feat/roles-coteachers`) are still claimed, and whether 0049 has merged to `main`. If it has, rebase first so 0050's journal `when` is newer.
- [x] 1.2 `drizzle/schemas/problems.ts`: replace `exampleCount` with `visible: boolean("visible").array().default([]).notNull()` and add a comment explaining "index i ↔ test i+1, missing = hidden".
- [x] 1.3 `drizzle/schemas/lessons.ts`: add the `TestVisibility` pgEnum (`problem_default`, `show_all`, `hide_all`) and the `testVisibility` column (default `problem_default`), then drop `showOutputs`. Export the `TestVisibility` type.
- [x] 1.4 `bun db:generate --name test_visibility` → rename or verify it as `0050_test_visibility.sql`, then hand-add the two `UPDATE` backfills between the ADDs and the DROPs (design D10).
- [x] 1.5 Apply on a throwaway DB, not the shared one: check that a problem with `exampleCount=2` and 4 tests comes out as `{t,t,f,f}`, that a problem with 0 tests comes out as `{}`, and that lessons with `show_outputs=true` come out as `show_all`.

## 2. Visibility rule (`lib/judge-report.ts`)

- [x] 2.1 Add the `TestVisibility` type, `VisibilityContext` (replacing `RedactContext`), and `isTestVisible(index, ctx)` (1-based).
- [x] 2.2 Add `visibleTests(inputs, outputs, ctx)` → `{ tests: { index, input, output }[], hiddenCount }`.
- [x] 2.3 Rewrite `redactFailure` to use `isTestVisible`: either full detail or `{ index, failure_kind, redacted, error? (compile only) }`. Remove the exercise branch.
- [x] 2.4 `redactSubmission`: take `problem: { createdBy; visible }`.
- [x] 2.5 `lib/judge-report.test.ts`: move the fixtures to `visible`, and add cases for a non-contiguous visible test, a missing flag counted as hidden, `show_all` revealing a hidden test, `hide_all` hiding a visible test (with compiler output kept), `fullAccess` overriding `hide_all`, the absence of any partial redaction state, `isTestVisible` itself, and `visibleTests` numbering and `hiddenCount`. Run `bun test lib/judge-report.test.ts`.

## 3. Server actions

- [x] 3.1 Add an `exerciseFullAccess` helper (problem author, lesson owner or classroom owner), shared by `getExercise` and `getExerciseSubmissions`.
- [x] 3.2 `getExercise`: load the classroom owner and `testVisibility`, strip `inputs`/`outputs` from `problem`, and return `tests` + `hiddenTestCount` built with `visibleTests`.
- [x] 3.3 `getExerciseSubmissions`: build `VisibilityContext` from `problem.visible` + `lesson.testVisibility` + `exerciseFullAccess`.
- [x] 3.4 `getProblem` / `getProblemTests`: filter by `visible` instead of slicing, and return the original indexes for samples (update the `ProblemTestCase` type and the Tests tab / results consumers to label with the index).
- [x] 3.5 `getProblems`, `exportContest`, and `getSubmissions`/`getUserSubmissions` (practice, contest, profile): swap `exampleCount` for `visible` in selects and redaction calls.
- [x] 3.6 `updateProblem`: replace `exampleCount` in the zod allowlist with `visible: z.array(z.boolean())`, and normalize `visible` to `inputs.length` on write (when either one is sent).
- [x] 3.7 `updateLesson` accepts `testVisibility`, validated with `z.enum(TestVisibility.enumValues)`, and drops `showOutputs`. This replaces the planned separate action; see design D7, revised.
- [x] 3.8 `bunx tsc --noEmit` passes, and `grep -rn "exampleCount\|showOutputs" web --include='*.ts*'` returns only import-legacy hits.

## 4. Problem import

- [x] 4.1 `lib/problem-import/schema.ts`: add `visible` (with a length check), keep `exampleCount` as a deprecated optional (≥ 0, ≤ tests), reject both together, and default to `[true, false…]`. Output carries `visible` only.
- [x] 4.2 Update the field docs and template in the same file, plus `import.tsx`'s preview column (count of visible tests).
- [x] 4.3 `lib/problem-import/schema.test.ts`: add cases for a `visible` length mismatch, legacy conversion, both fields set, the neither-given default, and the existing exampleCount > tests case.
- [x] 4.4 Rewrite `problems.json` from `exampleCount` to `visible`, then check that it still imports via the dialog preview.

## 5. Problem editor

- [x] 5.1 `problems/_components/create.tsx`: the form holds one `tests: { input, output, visible }[]` field array, replacing the separate `inputs`/`outputs` string arrays. react-hook-form's `useFieldArray` can't track arrays of plain strings; the browser check found a double add creating one row and a remove dropping a trailing empty row, which predates this change. New tests (added or AI-suggested) start with `visible: false`. On submit the array is split back into `inputs`/`outputs`/`visible`.
- [x] 5.2 Add an "Example (visible to students)" `Checkbox` to each test row, and remove the `exampleCount` field and the `Math.min` clamp.
- [x] 5.3 Show a non-blocking hint when there are tests but none are visible.

## 6. Exercise page

- [x] 6.1 Move `SubmissionDetails` + `CodeBlock` from `contests/_components/tabs/problem/submission-list.tsx` into `components/submissions/submission-details.tsx`, and update the contest import.
- [x] 6.2 `ExerciseSubmissions`: render `<SubmissionDetails>` under the code for every judged submission, and drop the duplicate constraint-violation block.
- [x] 6.3 `ExerciseTestCases`: take `tests` + `hiddenTestCount`, label each test "Test {index}" with its input and expected output, and add a hidden-count line. Under `hide_all`, show only the "all N hidden" line.
- [x] 6.4 Update the `exercise-detail.tsx` comments that reference `showOutputs`.

## 7. Lesson settings control

- [x] 7.1 Add `components/ui/toggle-group.tsx` (shadcn toggle-group, using the existing `radix-ui` dependency).
- [x] 7.2 `useUpdateLesson` takes `testVisibility`. It was already optimistic with narrow invalidation upstream (design D7, revised).
- [x] 7.3 `manage-lesson.tsx`: replace the `Switch` with a 3-item `ToggleGroup` with per-option tooltips. Remove `showOutputs` from `useUpdateLesson`'s input type.

## 8. i18n, seeds, specs

- [x] 8.1 `messages/en.json` + `br.json`: add labels and hints for the three modes, the "Example (visible to students)" checkbox, the "N hidden test cases" / "All N test cases are hidden" lines, the "no examples" hint, and "Test {index}". Remove `showOutputs`, `showOutputsHint`, `examplesShown` and the `exampleCount` help text.
- [x] 8.2 `drizzle/seed-lessons.ts` and `docs/presentation/seed_v4.py`: write `visible` instead of `example_count`.
- [x] 8.3 `openspec validate test-visibility --strict` passes.

## 9. Verification

- [x] 9.1 `bun test`, `bunx tsc --noEmit`, and `bun lint` all pass in `web/`.
- [x] 9.2 Browser check on `bun dev -p $DEV_PORT` with the test accounts. As a student in a `problem_default` lesson, the card shows only visible tests, a wrong answer on a visible test shows input, expected and actual, and a wrong answer on a hidden test shows the hidden notice. Switching to `show_all` and `hide_all` changes both the card and the report. The owner sees everything in all three modes. The segmented control responds instantly.
- [x] 9.3 Practice and contest regression check: samples follow the editor checkboxes, and hidden failures stay redacted.
- [x] 9.4 Note the shared-DB migration timing in the PR description, along with 0049/0051 ordering (design: Risks).
