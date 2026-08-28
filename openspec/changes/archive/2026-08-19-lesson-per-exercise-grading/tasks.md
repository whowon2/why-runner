## 1. Judge: run all test cases for exercise submissions

- [x] 1.1 Add `run_all: bool` param to `grade()` in `judge/src/main.rs`; keep compile-error short-circuit unconditional, gate the TLE/runtime-error/wrong-answer `break` on `!run_all`
- [x] 1.2 Update `process_job` call-site to pass `sub.exercise_id.is_some()` as `run_all`; leave `process_validation_job`'s call passing `false` (unchanged, reference-solution validation isn't tied to an exercise)
- [x] 1.3 Add/update judge tests covering: exercise submission runs all tests past a mid-suite failure, contest submission still stops at first failure, compile error stops immediately in both cases

## 2. Web: schema migration

- [x] 2.1 Add `lesson.showOutputs: boolean` (default `false`, not null) to `web/drizzle/schemas/lessons.ts`
- [x] 2.2 Add `exerciseCompletion.feedback: text` (nullable) to `web/drizzle/schemas/lessons.ts`
- [x] 2.3 Drop `lessonSubmission.score` column from `web/drizzle/schemas/lessons.ts`
- [x] 2.4 Generate and review migration SQL (`bun db:generate`), run it (`bun db:migrate`)

## 3. Web: exercise test-case visibility

- [x] 3.1 Extend/reuse `getProblemTests` (or an exercise-scoped equivalent) to return declared test-case inputs (always) and outputs (only when the exercise's lesson has `showOutputs` true) — done by masking `problem.outputs` directly in `getExercise` rather than a separate action
- [x] 3.2 Wire a hook (new or reuse `useProblemTests`) into `ExerciseDetail` (`web/app/[locale]/classes/_components/exercise-detail.tsx`) to render test cases in a new panel/section
- [x] 3.3 Add `showOutputs` toggle to lesson settings UI (`web/app/[locale]/classes/_components/manage-lesson.tsx`), wired through `updateLesson`/`setLessonPublished` action in `web/lib/actions/lessons/update-lesson.ts`

## 4. Web: derived per-exercise scoring

- [x] 4.1 Add a helper that, given an `exerciseCompletion` row's `submissionId`, loads `submission.output`, parses the `JudgeReport` JSON, and returns `passed_count / total_tests` (0 if no submission or unparseable)
- [x] 4.2 Update `getLessonReview` (`web/lib/actions/lessons/get-lesson-review.ts`) to compute and return each exercise's derived score, and the lesson-total as the sum of each exercise's fraction
- [x] 4.3 Remove `score` param from `reviewLessonSubmission`/replace with a feedback-only action (see task 5.1) — delete any code path that writes to `lessonSubmission.score`

## 5. Web: per-exercise feedback

- [x] 5.1 Add `setExerciseFeedback(userId, exerciseId, feedback)` server action (new file or extend `web/lib/actions/lessons/review-lesson-submission.ts`), authorized to the lesson's `createdBy` only, writing to `exerciseCompletion.feedback`
- [x] 5.2 Wire a hook for the new action, invalidating the lesson-review query on success (per `mutation-cache-invalidation` skill conventions)
- [x] 5.3 Update `lesson-review.tsx`: replace `ReviewScoreForm`'s numeric input with a read-only derived score badge per exercise plus a feedback textarea + save action per exercise

## 6. Verification

- [x] 6.1 `bun lint` in `web/`; judge `cargo check`/`cargo test` in `judge/` — `bun lint`/`tsc --noEmit` clean of new errors (pre-existing unrelated lint errors remain); judge `cargo check` and `cargo test grade_tests` both pass
- [x] 6.2 Manual pass: submit an exercise that fails mid-suite, confirm `passed_count` reflects tests after the failure too; confirm contest submissions still stop at first failure — done end-to-end (real browser + rebuilt judge Docker container + Postgres, not just unit tests): seeded a problem where test 2's expected output is deliberately wrong, submitted a correct echo solution as a real student account; DB row shows `{"passed":false,"total_tests":3,"passed_count":2,"failure_details":{"index":2,...}}` — tests 1 and 3 both graded and counted despite the test-2 failure. Contest early-exit path unchanged by this diff, covered by the `stop_at_first_failure_when_run_all_is_false` judge test.
- [x] 6.3 Manual pass: toggle `showOutputs` off/on, confirm exercise page shows inputs always, outputs only when on — toggled on as professor via the browser UI, confirmed as student the exercise page rendered all 3 test-case inputs and outputs (including the deliberately-wrong output "999" for test 2)
- [x] 6.4 Manual pass: professor review page shows correct per-exercise derived scores, lesson-total sum, and persists feedback text per exercise — review page showed "Score: 0.67" (lesson total) and "0.67" (per-exercise badge, matching 2/3 passed), feedback textarea saved "Nice try, but check test case 2." with a "Feedback saved" toast and the value persisted on screen
