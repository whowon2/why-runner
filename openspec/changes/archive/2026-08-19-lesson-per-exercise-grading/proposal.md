## Why

Lesson review today only lets a professor set one manual, unscaled `score` integer for a student's *entire* lesson submission, after the due date — there's no per-exercise breakdown, no feedback text, and no way for a student to see edge-case inputs before submitting. Grading also inherits the judge's early-exit behavior (stop at first failing test case), which undercounts how much of a solution was actually correct. This proposal makes exercise scoring objective (fraction of test cases passed, judge-computed) and per-exercise, adds professor feedback text per exercise, and gives professors a lesson-level toggle to reveal expected outputs (not just inputs) so they can manually spot hardcoded answers during review.

## What Changes

- Judge: `grade()` gains a `run_all` flag; when the submission belongs to an exercise (`exercise_id.is_some()`), the judge runs every declared test case instead of stopping at the first failure, so `passed_count`/`total_tests` reflect true pass count. Compile errors still short-circuit immediately (identical outcome on every test case, no point re-running). Contest and standalone/practice submissions keep today's stop-at-first-failure behavior — **no change to their grading semantics**.
- `lesson` gains a `showOutputs` boolean (default `false`). When on, the exercise page shows each declared test case's expected output alongside its input; when off (default), only inputs are shown. **BREAKING (data model)**: new required column, needs a migration with a default.
- Exercise page (`exercise-detail.tsx`) shows the problem's declared test-case inputs (and, if `showOutputs`, expected outputs) — this is new; the page currently shows none.
- `exerciseCompletion` gains a professor-authored `feedback` text column (nullable), settable per exercise per student during lesson review.
- Per-exercise score is derived, not stored: computed from the student's latest exercise submission's judge result (`passed_count / total_tests`), read at review/display time.
- `lessonSubmission.score` (currently a manually-set, unscaled integer) becomes a computed value: the sum of each exercise's normalized fraction (equal weight per exercise, independent of how many test cases each problem declares). **BREAKING**: `lessonSubmission.score` column is dropped; `reviewLessonSubmission` action's signature changes from `(submissionId, score)` to per-exercise `(exerciseCompletionId, feedback)` — professors no longer set a score directly, only feedback text.
- Lesson review UI (`lesson-review.tsx`) replaces the single numeric `ReviewScoreForm` with a per-exercise view: derived score badge (read-only) + feedback text input, per student per exercise.

## Capabilities

### New Capabilities
- `lesson-grading`: Per-exercise objective scoring (test-case pass fraction, judge runs all test cases for lesson exercises), per-exercise professor feedback, lesson-level output visibility toggle, and lesson-total score as the sum of each exercise's normalized fraction.

### Modified Capabilities
(none — no existing spec file covers exercise submission grading or lesson review; this is net-new spec territory)

## Impact

- `judge/src/main.rs` (`grade()`, `process_job()`) — new `run_all` parameter, call-site change.
- `judge/src/models.rs` — no shape change to `JudgeReport`.
- `web/drizzle/schemas/lessons.ts` — `lesson.showOutputs` (new column), `exerciseCompletion.feedback` (new column), `lessonSubmission.score` (dropped column) — migration required.
- `web/lib/actions/lessons/review-lesson-submission.ts` — signature/behavior change.
- `web/lib/actions/lessons/get-lesson-review.ts` — must compute and return per-exercise + lesson-total derived scores.
- `web/lib/actions/lessons/update-lesson.ts` — add `showOutputs` toggle to lesson settings.
- `web/app/[locale]/classes/_components/exercise-detail.tsx` — show test-case inputs/outputs.
- `web/app/[locale]/classes/_components/lesson-review.tsx`, `manage-lesson.tsx` — UI changes for per-exercise feedback and the `showOutputs` toggle.
- `web/lib/actions/problems/get-problem-tests.ts` / `hooks/use-problem-tests.tsx` — likely reused or extended for exercise test-case display (currently unused by the exercise page).
