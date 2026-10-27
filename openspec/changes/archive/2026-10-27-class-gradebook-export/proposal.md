## Why

A professor can only see scores one lesson at a time (the lesson review page), and only after the due date. There is no single view of how every student is doing across every lesson of a class, and no way to take those scores out of WhyRunner into the institution's grading spreadsheet.

## What Changes

- New professor-only **gradebook** page per class (`/classes/[classSlug]/gradebook`): a students × lesson-exercises matrix, grouped by lesson, with each cell showing the exercise score already used by lesson review (fraction of test cases passed from the student's snapshotted lesson submission), a per-lesson subtotal per student, and a per-student overall total.
- New owner-only server action `getClassGradebook(classroomId)` that derives everything from existing tables (`lesson`, `exercise`, `exercise_completion`, `submission`, `lesson_submission`, `classroom_membership`). No migration.
- Pure aggregation module (`lib/gradebook.ts`) that turns those rows into the matrix and totals, reusing `computeExerciseScore` and the lesson-total rule (sum of normalized exercise fractions); unit-tested.
- CSV export of the gradebook (one row per student, one column per exercise plus lesson subtotals and overall total), produced client-side from the same data with the RFC 4180 / BOM / formula-injection-safe writer from `lib/contest/export-bundle.ts`; unit-tested.
- "Gradebook" entry point on the class page header, shown only to the class owner.

## Capabilities

### New Capabilities
- `class-gradebook`: professor-only per-class gradebook matrix (scores, lesson subtotals, student totals) and its CSV export.

### Modified Capabilities
- `query-cache-invalidation`: adds the gradebook refresh requirement (lesson-grading score rules are reused unchanged).

## Impact

- `web/lib/gradebook.ts` (+ test), `web/lib/actions/classes/get-class-gradebook.ts`, `web/hooks/use-class-gradebook.tsx`, new page + component under `web/app/[locale]/classes/`, class-detail header button, `messages/{pt,en}.json`.
- Cache: mutations that change gradebook inputs (lesson submit/review, member removal, lesson/exercise edits) invalidate the new query key.
- No DB migration, no judge changes, no dependency on specific submission status values (score comes from `passed_count / total_tests`).
