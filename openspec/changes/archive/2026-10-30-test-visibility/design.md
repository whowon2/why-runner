## Context

Test-case visibility comes from two sources today, applied in three places:

| Where | Rule today |
|---|---|
| `getProblem`, `getProblemTests` (practice workspace) | `inputs/outputs.slice(0, exampleCount)` |
| `redactFailure` in `lib/judge-report.ts` | practice/contest: `index <= exampleCount` shows the test in full, otherwise verdict only. Exercise: input and actual always shown, expected only if `lesson.showOutputs` |
| `getExercise` (exercise "Test cases" card) | every input sent to the client, outputs only if `showOutputs` |

The exercise branch ignores `exampleCount` altogether, so hidden inputs leak on the exercise page. The exercise submission list (`ExerciseSubmissions` in `exercise-detail.tsx`) never renders `s.output`, even though `getExerciseSubmissions` already returns it redacted. Both bugs came up in the 2026-10-29 classroom test.

The judge writes the full `JudgeReport` (only the *first* failing test's details, 1-based `index`) to `submission.output`. It reads `problem` through an explicit column list (`judge/src/db.rs:get_problem`), so it never sees `example_count` or lesson settings.

## Goals / Non-Goals

**Goals:**
- Per-test visibility chosen by the problem author.
- A per-lesson override with three modes, editable quickly (optimistic UI).
- One pure function that decides "may this viewer see test N?", used for both the pre-submit card and the post-submit report.
- Exercise submissions show the same failing-test report as contests and practice.
- No hidden test data reaches a student's browser, even through direct server-action calls.

**Non-Goals:**
- Per-exercise overrides. Lesson-level only.
- Showing more than the first failing test. The judge only records one.
- Changing what the AI hint (`getAIHelp`) receives. It already reads the raw report server-side, and its prompt forbids leaking hidden data.
- Co-teacher access. `feat/roles-coteachers` will extend the full-access check (see Open Questions).
- Changing contest behaviour beyond swapping `exampleCount` for `visible`.

## Decisions

### D1. `problem.visible boolean[]` parallel to `inputs`/`outputs`

`visible: boolean("visible").array().default([]).notNull()`. Index *i* (0-based) flags test *i+1*. **A missing or short entry means hidden**, so a stale or short array can only hide data and never leak it. `updateProblem` normalizes on write: it pads with `false` or truncates to `inputs.length`.

*Alternatives:* a `problem_test` table (cleaner, but every reader and the judge would have to change, which is too much for this change). A `visibleIndexes int[]` (sparse, but every editor operation then has to renumber indexes). A parallel boolean array matches how `inputs`/`outputs` already work, and the editor can treat it as a third `useFieldArray`.

No DB `CHECK (cardinality(visible) = cardinality(inputs))`: partial updates (`inputs` without `visible`) would fail on it, and the "missing = hidden" rule already makes a mismatch safe.

### D2. `lesson.testVisibility` pg enum

```ts
export const TestVisibility = pgEnum("test_visibility", ["problem_default", "show_all", "hide_all"]);
testVisibility: TestVisibility("test_visibility").default("problem_default").notNull(),
```
These are Postgres enum values, so they are permanent. They get localized labels under `RoadmapPage.ManageLesson.TestVisibility`. Only `web` uses it, and the judge never reads lessons, so `judge/src/models.rs` needs no sync.

### D3. One rule: `isTestVisible`

In `lib/judge-report.ts` (still pure, still under `bun test`):

```ts
export type TestVisibility = "problem_default" | "show_all" | "hide_all";

export type VisibilityContext = {
  /** Problem author, lesson owner or class owner: sees everything. */
  fullAccess: boolean;
  /** problem.visible; index i ↔ test i+1. Missing = hidden. */
  visible: boolean[];
  /** Lesson exercises only; practice/contest behave as problem_default. */
  mode?: TestVisibility;
};

/** `index` is 1-based, as in JudgeReport. */
export function isTestVisible(index: number, ctx: VisibilityContext): boolean {
  if (ctx.fullAccess) return true;
  switch (ctx.mode ?? "problem_default") {
    case "show_all": return true;
    case "hide_all": return false;
    default: return ctx.visible[index - 1] === true;
  }
}
```

`RedactContext` becomes `VisibilityContext`. `redactFailure` drops its exercise branch. The test is either shown in full (`input`, `expected`, `actual`, `error`) or reduced to `{ index, failure_kind, redacted: true }` plus compiler output for `compile_error`. That is the current hidden-test shape, so `HiddenTestNotice`/`isHiddenFailure` keep working. The old "exercise: hide expected only" partial shape (`redacted: true` with `input` present) goes away.

`redactSubmission`'s row type changes from `problem: { createdBy; exampleCount }` to `problem: { createdBy; visible }`.

A helper `visibleTests(inputs, outputs, ctx)` returns `{ index, input, output }[]` for the tests the viewer may see, plus `hiddenCount`. `getExercise`, `getProblem` and `getProblemTests` all use it, so the card, the practice samples and the report can't drift apart.

### D4. Who gets `fullAccess`

- Practice/contest: `problem.createdBy === viewer` (unchanged; contest owners are still redacted).
- Exercise: `problem.createdBy`, `lesson.createdBy` or `classroom.createdBy` equals the viewer. A small `exerciseFullAccess(found, userId)` helper keeps `getExercise` and `getExerciseSubmissions` consistent, and gives `feat/roles-coteachers` one place to add co-teachers.

### D5. Server decides; the client only renders

`getExercise` stops spreading `found.problem` (which ships every input and output today). It returns `problem` without `inputs`/`outputs`, and adds `tests: { index, input, output }[]` (visible only) and `hiddenTestCount`. The card renders "Test {index}" from the original numbers, so "Test 4 failed (hidden)" in a report matches the card's numbering. `getProblem` and `getProblemTests` likewise filter by `visible` instead of slicing, and keep the original indexes.

### D6. Reuse the report component

`SubmissionDetails` (now in `contests/_components/tabs/problem/submission-list.tsx`) moves to `components/submissions/submission-details.tsx` along with `CodeBlock`, and the contest list imports it from there. `ExerciseSubmissions` renders `<SubmissionDetails output status constraintViolationDetail />` under the code, replacing its own constraint-violation block. Practice `results.tsx` keeps its dialog layout, since it already uses `HiddenTestNotice`/`isHiddenFailure`, and gets no extra refactor.

### D7. Lesson setting: segmented control, optimistic, narrow invalidation

The control is a `ToggleGroup type="single"`: a small `components/ui/toggle-group.tsx` on the existing `radix-ui` dependency, with three items and a hint for each.

*Revised during implementation:* `fix/classroom-feedback-quick` (merged before this change) already made `useUpdateLesson` optimistic. It applies changes to `["lessons", id]` in `onMutate`, rolls back on error, and on settle refetches only this lesson and its class, while marking `["exercises"]` stale without refetching. That's the narrow invalidation this decision asked for, so the control reuses `useUpdateLesson`/`updateLesson` with a `testVisibility` field, which `updateLesson` validates with `z.enum(TestVisibility.enumValues)`, instead of a separate hook and action. The ownership check stays the existing `assertOwnsLesson`.

`updateLesson` and `useUpdateLesson` replace `showOutputs` with `testVisibility`.

### D8. Problem editor checkbox

The form holds one `tests: { input, output, visible }[]` field array and splits it into `inputs`/`outputs`/`visible` on submit. *Revised during implementation:* the old form had separate `useFieldArray`s over plain string arrays, which react-hook-form doesn't support. A double add created one row, and a remove also dropped a trailing empty row, so a third parallel array couldn't stay aligned. Each test row has a `Checkbox` labelled "Example (visible to students)". `addInput` and `addEdgeCase` (AI review suggestions) append `visible: false`, and removing a row removes its whole object. The `exampleCount` number field and its `Math.min` clamp go away. Warning (not blocking): if a problem has tests but none are visible, show a hint that students in `problem_default` lessons and in practice will see no examples.

### D9. Import: `visible` with legacy `exampleCount`

`problemImportSchema` accepts `visible?: boolean[]` (its length must equal `inputs.length`, and errors are located at `visible`) **or** the legacy `exampleCount?: int ≥ 0` (≤ test count), which is converted with `inputs.map((_, i) => i < exampleCount)`. Supplying both is a located error. If neither is given, the default is `[true, false, false, …]`, the same as today's default of `exampleCount: 1`, so existing JSON files behave the same. `problems.json` is rewritten to use `visible` so it serves as the canonical example. The in-app field docs and template list `visible` and mention `exampleCount` as deprecated.

### D10. Migration `0050_test_visibility.sql`

Run `bun db:generate --name test_visibility` for the snapshot and journal, then hand-edit the SQL to add the backfills between the ADD and the DROP:

```sql
ALTER TABLE "problem" ADD COLUMN "visible" boolean[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
UPDATE "problem" SET "visible" = ARRAY(
  SELECT i <= "example_count" FROM generate_series(1, cardinality("inputs")) AS i
);--> statement-breakpoint
ALTER TABLE "problem" DROP COLUMN "example_count";--> statement-breakpoint
CREATE TYPE "public"."test_visibility" AS ENUM('problem_default', 'show_all', 'hide_all');--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "test_visibility" "test_visibility" DEFAULT 'problem_default' NOT NULL;--> statement-breakpoint
UPDATE "lesson" SET "test_visibility" = 'show_all' WHERE "show_outputs";--> statement-breakpoint
ALTER TABLE "lesson" DROP COLUMN "show_outputs";
```
`ARRAY(SELECT … generate_series(1, 0))` yields `'{}'` for problems without tests.

**Behaviour change for existing lessons that had `showOutputs = false`:** before, students saw *every input*. After the migration, the lesson is in `problem_default` and only sees the visible tests. This is the intended fix (bug 2), but professors should know about it. The mode control is the opt-out (`show_all`).

## Risks / Trade-offs

- **Drizzle skips out-of-order migrations.** The pg migrator applies only migrations whose journal `when` is later than the last applied one. If 0050 is applied before `feat/signup-ra`'s 0049 lands, and 0049's `when` is older, 0049 is **silently skipped**. → Merge in order 0049 → 0050 → 0051. If 0050 merges first, regenerate 0049's journal entry with a newer `when` (and fix its snapshot `prevId` chain) before merging it. Check `drizzle.__drizzle_migrations` after each.
- **Shared dev Postgres across worktrees.** Applying 0050 drops `example_count` and `show_outputs`. Any other worktree on old code that selects `problem`/`lesson` with default columns (`db.query.problem.findFirst` with no `columns`) then fails with `column "example_count" does not exist`. → Don't run `db:migrate` against the shared DB until this branch is ready to merge. During development, test the migration on a throwaway DB (`createdb whyrunner_tv && DATABASE_URL=… bun db:migrate`), or see Open Question 1.
- **Same problem in practice and in a lesson.** Visibility is per (submission context): an exercise submission uses the lesson mode, while a practice submission to the same problem uses `problem_default`. A `show_all` lesson therefore doesn't reveal tests in practice. This is correct, but worth a line in the hint text.
- **`show_all` reveals the answer key.** This is by design (the old `showOutputs` did the same for outputs). The tooltip says so.
- **Old `redacted`-with-input shape.** Clients no longer receive a partially redacted failure. `SubmissionDetails` already treats `expected === undefined` as "don't render", so cached old responses still render fine.
- **Report index vs card index.** Both use the original 1-based test numbers (D5), so they match even when the visible tests aren't contiguous.

## Migration Plan

1. Land code and migration together on `feat/test-visibility`, rebased after `feat/signup-ra` (0049) merges.
2. Production: `scripts/migrate-if-production.mjs` runs on `next build`. The add, backfill and drop run in one migration, and the old code stops working once it runs, which is acceptable for this single-deploy app with no rolling deploys.
3. Rollback: a down-script that re-adds `example_count` (as `coalesce(array_position(visible, false) - 1, cardinality(visible))`, i.e. the length of the leading visible run) and `show_outputs` (`test_visibility = 'show_all'`). Non-contiguous visible sets lose information on rollback. This is kept as a note, not shipped.

## Open Questions

1. **Drop now or later?** The user asked to drop `example_count` and `show_outputs` in 0050. The alternative is to add and backfill in 0050 and drop in a follow-up migration after merge, which keeps other worktrees working on the shared DB during development. Recommendation: keep the drop in 0050 as asked, and test it on a throwaway DB.
2. **Co-teachers:** once `feat/roles-coteachers` lands, `exerciseFullAccess` should include class co-teachers. Whichever branch merges second adds that.
3. **`hide_all` and the card:** the proposal hides the card and shows "All N test cases are hidden in this lesson". Should it keep listing "Test 1..N (hidden)" placeholders instead? The current proposal uses a single line.
