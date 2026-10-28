## Why

The gradebook CSV (`class-gradebook`) only carries one number per student × exercise: the passed-test fraction of the handed-in snapshot. Teachers grading or auditing a class also need *why* a student got that score — the verdict (wrong answer, TLE, compile error…), passed/total tests, language, when the lesson was handed in and whether it was late — and need to see students who worked on an exercise but never handed the lesson in. Today that means opening every lesson review page one by one.

## What Changes

- New owner-only **detailed results export** for a class: a CSV with one row per student × published-lesson exercise, carrying the handed-in snapshot's verdict, passed/total tests, score, language and submission time, the lesson's hand-in state (not submitted / on time / late) with timestamps and review state, the teacher's feedback, and live activity on that exercise (attempt count, last attempt time, whether any attempt passed).
- New server action that assembles those rows on demand (only counts, statuses and timestamps leave the server — never code or raw judge output).
- Gradebook page export button becomes a two-option menu: existing "Scores (one row per student)" and the new "Detailed results (one row per student × exercise)".
- Pure, unit-tested module for row building and CSV, reusing `toCsv` (RFC 4180, BOM, formula-safe) and `computeExerciseScore`, so the score column always equals the gradebook's.
- No schema change, no migration, no judge change.

## Capabilities

### New Capabilities
- `class-results-export`: owner-only per-student × per-exercise results CSV for a class — row set, columns, verdict/score/attempt semantics, lateness, access control and file format.

### Modified Capabilities
- `class-gradebook`: the gradebook's export entry point offers both the existing scores CSV and the new detailed results CSV.

## Impact

- `web/lib/class-results.ts` (+ `.test.ts`): new pure builder + CSV.
- `web/lib/actions/classes/export-class-results.ts`: new `"use server"` action (auth via `getCurrentUser` + `assertClassOwner`, zod id).
- `web/app/[locale]/classes/_components/class-gradebook.tsx`: export dropdown.
- `web/messages/{en,pt}.json`: new `ClassesPage` strings.
- Reads `lesson`, `exercise`, `problem`, `classroom_membership`, `lesson_submission`, `exercise_completion`, `submission` (indexed by `exercise_id`); no writes, so no React Query invalidation changes.
