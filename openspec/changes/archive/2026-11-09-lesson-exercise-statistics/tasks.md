## 1. Server

- [x] 1.1 Add `web/lib/actions/lessons/get-exercise-statistics.ts`: membership check, class-scoped counts for managers (exercise submissions by student members, staff excluded, CANCELED not an attempt, student count), global `getProblemStatistics` otherwise
- [x] 1.2 Add `web/hooks/use-exercise-statistics.tsx` with key `["problem-statistics", "exercise", exerciseId]`

## 2. UI

- [x] 2.1 Extract shared `StatisticsTable` from `workspace/statistics.tsx`; keep `ProblemStatisticsTab` rendering it
- [x] 2.2 Add `ExerciseStatisticsTab` (scope label + student count for class scope)
- [x] 2.3 Add Statistics rail item and drawer to `exercise-workspace.tsx`
- [x] 2.4 Add i18n strings (all locales in `web/messages/`)
- [x] 2.5 Invalidate exercise statistics in `use-create-exercise-submission`

## 3. Verify and ship

- [x] 3.1 Lint and typecheck
- [x] 3.2 Browser check on DEV_PORT: teacher sees class-scoped numbers, student sees global numbers
- [x] 3.3 Bump `web/package.json` minor version
- [x] 3.4 Add row to `docs/evaluation/post-evaluation-changes.md`
