## Why

In the 2026-10-29 classroom test the professor asked to see a problem's statistics from the lesson activity view too (survey review item P11). Today the Statistics drawer exists only on the standalone problem page, and its numbers are global, so a teacher can't see how their own class is doing on an exercise without leaving the lesson.

## What Changes

- The lesson exercise workspace gets a Statistics rail item and drawer, same table as the problem page (solved by, attempted by, success rate).
- For class managers (owner, co-teacher, admin) the numbers are scoped to the class: only this exercise's submissions, counted over the class's students (staff excluded), plus the class's student count so "solved by 3 of 20" is readable.
- For students the drawer shows the problem-wide (global) statistics, the same numbers the problem page shows.
- New server action `getExerciseStatistics(exerciseId)` (class membership required) and hook `useExerciseStatistics`; the statistics table becomes a shared presentational component used by both workspaces.
- Submitting an exercise invalidates the exercise statistics query.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `editor-workspace-shell`: the lesson exercise workspace rail gains a Statistics drawer, class-scoped for teachers and global for students.

## Impact

- `web/lib/actions/lessons/get-exercise-statistics.ts` (new), `web/hooks/use-exercise-statistics.tsx` (new)
- `web/app/[locale]/problems/_components/workspace/statistics.tsx` (split into shared table + problem tab)
- `web/app/[locale]/classes/_components/exercise-workspace.tsx` (rail item + drawer)
- `web/hooks/use-create-exercise-submission.tsx` (invalidation)
- `web/messages/*.json` (scope label strings)
- No DB migration, no judge change.
