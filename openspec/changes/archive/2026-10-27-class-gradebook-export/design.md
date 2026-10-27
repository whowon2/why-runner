## Context

Lesson scores are already derived, never stored: `computeExerciseScore` (`web/lib/exercise-score.ts`) reads `passed_count / total_tests` from the judge report on the submission snapshotted in `exercise_completion` when a student submits a lesson, and `getLessonReview` sums those per lesson. That review is per lesson and gated on the due date. Professors have no cross-lesson view or export. Parallel branches are changing submission status enums (new verdicts), plagiarism, judge and migrations (0048), so this change must stay in `web/`, add no migration, and not branch on status values.

## Goals / Non-Goals

**Goals:**
- One owner-only page per class with a students × exercises matrix, lesson subtotals and student totals.
- CSV export that matches the screen.
- Aggregation and CSV logic in pure, unit-tested modules.

**Non-Goals:**
- Weighting lessons/exercises, manual grade overrides, letter grades.
- Lesson deadlines / late penalties, plagiarism flags.
- Showing in-progress (non-submitted) work in cells.

## Decisions

1. **Data source = `exercise_completion` snapshot, same as lesson review.** Alternative: best live submission per exercise. Rejected — it would disagree with the lesson review page and the student's own lesson score badge. Not submitted → `null` cell, distinct from 0.
2. **No due-date gate.** Lesson review hides scores before the due date because students can still resubmit; the gradebook is a running view, so it shows whatever snapshot exists, and the UI marks lessons still open (due date in the future) so the professor knows the numbers can change.
3. **Pure core in `web/lib/gradebook.ts`.** `buildGradebook({ lessons, exercises, students, lessonSubmissions, completions })` takes already-fetched rows (completion carries only `submission.output`) and returns `{ lessons: [{ id, title, slug, dueDate, exercises: [{ id, problemTitle }] }], rows: [{ student, cells: (number|null)[], lessonTotals: (number|null)[], total }], maxTotal }`. `gradebookToCsv(gradebook)` builds rows and delegates to `toCsv` from `lib/contest/export-bundle.ts` (already RFC 4180 + BOM + formula-safe). Both are DB-free so `bun test lib` covers them.
4. **Server action `getClassGradebook(classroomId)`** in `lib/actions/classes/`: `getCurrentUser` + `assertClassOwner`, zod-parses the id, four batched queries (published lessons, their exercises with problem title, memberships with `publicUserColumns`, lesson submissions + completions with `submission.output` only). Never returns the raw `output` to the client — only numbers. Returns `ok(...)`.
5. **CSV built client-side** from the query's data, downloaded via `Blob` + object URL (same as contest export). Alternative: route handler like `/api/surveys/export`. Rejected — a second auth path and a second fetch for data the page already has.
6. **Routing/UI**: `app/[locale]/classes/[classSlug]/gradebook/page.tsx` following the `creating-a-page` skill (shared `PageHeader`), a client `ClassGradebook` component with a horizontally scrollable table with sticky student column, plus an owner-only "Gradebook" button in `ClassDetail`'s header.
7. **Cache key** `["classes", classroomId, "gradebook"]`. Existing mutations whose effects change it (submit lesson, remove member, update/create lesson, exercise add/remove) get it invalidated, per `mutation-cache-invalidation` — prefer prefix invalidation of `["classes", classroomId]` where the hook already has the id.

## Risks / Trade-offs

- [Large classes × many exercises produce a wide table] → horizontal scroll, sticky first column; CSV for real analysis.
- [Snapshot-only scores miss work done but not submitted] → explicit "not submitted" state, documented on the page.
- [Status enums changing in another branch] → score depends only on the judge report's counts, not on `status`.
