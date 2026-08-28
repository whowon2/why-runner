## Context

Lessons (`web/drizzle/schemas/lessons.ts`) are classroom-scoped assignments made of `exercise` rows, each wrapping a `problem`. Students submit code per exercise (`createExerciseSubmission` → `submission` row with `exerciseId` set); `submitLesson` snapshots the latest submission per exercise into `exerciseCompletion` and upserts a `lessonSubmission` row. Today's review flow (`getLessonReview`, `reviewLessonSubmission`, `lesson-review.tsx`) lets the professor set one manual, unscaled integer `score` on `lessonSubmission` after the due date, with no per-exercise breakdown and no feedback text.

Judge grading (`judge/src/main.rs::grade()`) stops at the first failing test case (compile error, TLE, runtime error, wrong answer). This is fine for contests/standalone (only pass/fail matters), but it means `passed_count`/`total_tests` — already computed and stored per submission as `JudgeReport` JSON in `submission.output` — undercounts true correctness for exercises: a student failing test 2 gets the same `passed_count` whether or not they'd have passed tests 3-5.

The exercise page (`exercise-detail.tsx`) currently shows zero test-case data — no samples, no hidden tests, before or after solving. `getProblemTests`/`useProblemTests` exist but aren't wired into the exercise flow at all.

## Goals / Non-Goals

**Goals:**
- Judge computes an honest `passed_count`/`total_tests` for exercise submissions by running every declared test case, without changing contest/standalone grading behavior or `JudgeReport`'s shape.
- Exercise page shows declared test-case inputs always, and expected outputs when the lesson's professor has opted in (`lesson.showOutputs`).
- Per-exercise score is derived (test-case pass fraction), not manually typed by the professor.
- Professor can attach free-text feedback per exercise per student during review.
- Lesson-total score is the sum of each exercise's normalized fraction (equal weight per exercise regardless of how many test cases each problem declares).

**Non-Goals:**
- No automated hardcoding/plagiarism detection. `showOutputs` only makes expected outputs visible to a human reviewer for manual comparison against submitted code; flagging suspicious submissions is future (AI-assisted) work, out of scope here.
- No change to contest or standalone/practice submission grading semantics — early-exit-on-first-failure stays exactly as is for both.
- No rubric/weighting system — every exercise counts equally toward the lesson total.
- No change to the due-date gate on `getLessonReview`/`reviewLessonSubmission` (review still only available after `dueDate`).

## Decisions

### 1. `run_all` flag keyed off `exercise_id.is_some()`, not a new column
Judge already branches per-submission on whether `exercise_id` is set (`resolve_constraint_status`, solution constraints). Reusing that same discriminator for `run_all` needs no new DB column or web-side plumbing — `process_job` just passes `sub.exercise_id.is_some()` into `grade()`. Contest/standalone submissions (`exercise_id: None`) are untouched.

### 2. Compile errors still short-circuit even when `run_all`
A compile error is identical on every test case (the code never runs) — re-running it N times would only waste sandbox time for no new information. `grade()` breaks immediately on compile error regardless of `run_all`; TLE/runtime-error/wrong-answer keep going when `run_all` is true, each recorded independently for `passed_count`, with `failure_details` still capturing only the *first* failure encountered (matches `JudgeReport`'s existing single-`Option<TestCaseResult>` shape — no consumer needs more than "the first thing that went wrong").

### 3. Score is computed at read time, not stored
`exerciseCompletion` doesn't get a `score` column. Instead, the professor's review UI (and `getLessonReview`) derive it on the fly: look up the exercise's `submissionId` → `submission.output` → parse `JudgeReport` JSON → `passed_count / total_tests`. This avoids a second source of truth that could drift from the actual judged submission (e.g. if a student resubmits after snapshot — though `submitLesson` re-snapshots on each lesson submission, so this is mostly a belt-and-suspenders simplicity call). `lessonSubmission.score` (currently stored) is dropped entirely and replaced with a computed sum at the same read time.

Alternative considered: store `score` on `exerciseCompletion` at snapshot time (`submitLesson`). Rejected — duplicates data already recoverable from `submission.output`, and reading a stored value can't reflect a `run_all` judge re-run without a resubmission anyway, so there's no durability benefit.

### 4. `exerciseCompletion.feedback` is the only new grading column
Feedback is inherently professor-authored, free text, no computable source — must be stored. Lives on `exerciseCompletion` (already the per-student-per-exercise row) rather than a new table, keyed by the existing `(userId, exerciseId)` primary key.

### 5. `lesson.showOutputs` is a lesson-wide toggle, not per-exercise
Simplicity: one boolean on `lesson`, defaulting `false` (current behavior — outputs hidden). A professor who wants students to see edge cases for manual hardcode-detection review flips it for the whole lesson. Per-exercise granularity was considered and rejected as unnecessary complexity for the stated use case (a professor deciding this per-assignment, not per-problem-within-an-assignment).

### 6. `reviewLessonSubmission` action signature change
Old: `reviewLessonSubmission(submissionId, score)` — one call sets the whole lesson's score.
New: a per-exercise action, e.g. `setExerciseFeedback(exerciseCompletionUserId, exerciseId, feedback)` — professor writes feedback per exercise; no score parameter since score is always derived. `lessonSubmission.reviewedAt` semantics are unchanged (still a manual "I'm done reviewing this student's submission" marker set by the professor, decoupled from per-exercise feedback authorship).

## Risks / Trade-offs

- **[Risk] Migration drops `lessonSubmission.score`** → any historical manually-set scores are lost. Mitigation: this is pre-launch/low-traffic (TCC project); acceptable to drop. If needed, a one-time backfill could compute pre-migration `exerciseCompletion` fractions from existing `submission.output`, but existing lesson submissions predate `run_all` judge semantics and their `passed_count` reflects early-exit grading — backfilled scores would be *less* accurate than fresh ones. Recommend no backfill; scores simply reset/recompute going forward.
- **[Risk] `run_all` increases judge wall-clock time per exercise submission** (more sandboxed runs before returning a verdict) → mitigation: compile-error short-circuit already caps the worst case; test suites for exercises are expected to be small (same scale as existing problem test suites, no new data volume).
- **[Trade-off] Equal-weight-per-exercise sum can be gamed by an easy problem with few test cases counting the same as a hard one with many** → accepted per explicit product decision (normalize each exercise to a 0-1 fraction, sum with equal weight); no rubric/weighting system in this iteration.

## Migration Plan

1. Judge: add `run_all: bool` param to `grade()`, wire `process_job` call-site, add unit coverage for run-all vs stop-at-first-failure and the compile-error short-circuit. Deploy judge independently — it's backward compatible (older web schema doesn't need to change for this half).
2. Web: Drizzle migration — add `lesson.showOutputs` (boolean, default `false`, not null), add `exerciseCompletion.feedback` (text, nullable), drop `lessonSubmission.score` (integer, nullable — safe drop, no not-null/FK dependents).
3. Web: update `getLessonReview`, `review-lesson-submission.ts` (rename/reshape to feedback-only), `submitLesson`/`update-lesson.ts` (`showOutputs` toggle), `exercise-detail.tsx` (show inputs/outputs), `lesson-review.tsx` (per-exercise score badge + feedback input), `manage-lesson.tsx` (showOutputs toggle in lesson settings).
4. No rollback complexity beyond standard migration revert — no external system dependency, no data backfill to undo.

## Open Questions

- None outstanding — all prior open questions (rollup formula, feedback scope, run-all vs manual, showOutputs granularity) were resolved during exploration.
