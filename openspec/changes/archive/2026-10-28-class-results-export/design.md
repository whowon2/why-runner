## Context

`class-gradebook` (archived 2026-10-27) gives class owners a students × exercises score matrix and a wide CSV built client-side from `getClassGradebook`'s data. Scores are never stored: `computeExerciseScore` reads `passed_count / total_tests` from the judge report of the submission snapshotted in `exercise_completion` when the lesson is handed in. That design deliberately left out verdicts, in-progress work and lateness. Teachers now want them in a file. `judge-verdicts-checkers` has merged, so `submission.status` carries real verdicts (`WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, …). Relevant data already exists: `lesson_submission.submittedAt/reviewedAt`, `lesson.dueDate`, `exercise_completion.feedback/language`, `submission.exercise_id/status/created_at`. No migration needed.

## Goals / Non-Goals

**Goals:**
- Owner-only long-format CSV: one row per student × published exercise, with graded snapshot (verdict, tests, score), hand-in state/lateness, feedback, and live activity (attempts, last attempt, ever passed).
- Score column provably identical to the gradebook.
- Pure, `bun test`-covered builder; thin server action; no new routes.

**Non-Goals:**
- XLSX/ZIP formats, exporting code (contest export already does ZIP-with-code; not wanted for classes now).
- Plagiarism/similarity columns, AI-usage columns.
- Per-lesson export from the lesson review page (can reuse the builder later).
- Localised verdict labels or headers in the file.
- New DB index on `submission.exercise_id`.

## Decisions

1. **Long format, separate file — not more columns on the wide CSV.** Alternative: append verdict/attempt columns per exercise to the gradebook CSV. Rejected: column count would multiply by ~10 per exercise and the wide file stops being readable; long format pivots/filters cleanly in spreadsheets and pandas. The wide CSV stays unchanged.
2. **Server-built on demand via `exportClassResults(classroomId)` returning the CSV string.** Alternative: extend `getClassGradebook` and build client-side like the scores CSV. Rejected: the gradebook page would fetch per-submission aggregates on every load for a rarely used download. Contest export (`exportContestData`) already returns a server-built payload from an action; same pattern, `ok(csv)` wrapped with `action-result`. Client downloads via `Blob` like the gradebook.
3. **Pure core `web/lib/class-results.ts`.** `buildClassResults({ lessons, students, lessonSubmissions, completions, activity })` → `ClassResultRow[]`; `classResultsToCsv(rows)` → string via `toCsv`. Inputs are already-fetched plain rows; completions carry `status`, `output`, `language`, `createdAt`, `feedback`; the builder parses `output` (new helper `parseTestCounts` next to `computeExerciseScore` in `lib/exercise-score.ts`, with `computeExerciseScore` re-expressed through it so they can't diverge). Score uses `computeExerciseScore` directly and `formatScore` from `lib/gradebook.ts`. The raw `output` never leaves the server: the action returns only the CSV string.
4. **Shared query helper for gradebook data.** The lessons/members/lessonSubmissions/completions fetch in `getClassGradebook` is extracted into server-only `lib/classes/load-class-results-data.ts` (`import "server-only"`, no auth) used by both actions, so the row sets (published lessons, owner excluded, ordering) can't drift. Completion query widens to `submission: { status, output, language, createdAt }` + `feedback`, `submittedAt`/`reviewedAt` on lesson submissions; the gradebook action keeps mapping only what it needs.
5. **Activity = one grouped query.** `select user_id, exercise_id, count(*), max(created_at), bool_or(status = 'PASSED') from submission where exercise_id in (…) and user_id in (…) group by 1, 2`. Only `PASSED` is branched on — the single stable success code; no other verdict logic.
6. **Lateness computed in builder**: `late` iff `dueDate && submittedAt > dueDate`. Mirrors `createExerciseSubmission`'s lock (`dueDate < now`): a hand-in strictly after the due instant is late, exactly at it is on time. Note that students can't submit exercises after the due date, so `late` mostly flags lessons whose due date was moved earlier after hand-in.
7. **Columns (stable English snake_case):** `student_name, username, lesson, lesson_due_date, exercise_position, problem_code, problem_title, lesson_state, lesson_submitted_at, reviewed_at, verdict, passed_tests, total_tests, score, language, graded_submission_at, attempts, last_attempt_at, ever_passed, feedback`. Timestamps `toISOString()`, due date `YYYY-MM-DD`.
8. **UI**: gradebook's export `Button` becomes a `DropdownMenu` (`components/ui/dropdown-menu`) with "Scores (one row per student)" (existing client path) and "Detailed results (one row per student × exercise)" (calls the action, shows a pending state, `toast` on error like contest export). No React Query cache: it's a one-shot download, so no invalidation work.

## Risks / Trade-offs

- [No index on `submission.exercise_id`; activity query scans by `user_id`/`exercise_id`] → classes are small (tens of students); filter on both lists; add an index in a later migration if it shows up slow.
- [Snapshot PENDING when the lesson was handed in mid-judging] → verdict column shows `PENDING`; documented by the raw-status rule, and re-export gets the final verdict.
- [Feedback is free text written by the teacher] → goes through `toCsv` formula neutralisation; it's their own text, no privacy concern.
- [Refactoring `getClassGradebook`'s fetch] → existing `lib/gradebook.test.ts` keeps covering the builder; gradebook output must stay identical (manual check in tasks).

## Migration Plan

None — read-only feature, no schema change. Rollback = revert.
