## Context

An assignment is a `lesson` row in `web/drizzle/schemas/lessons.ts`, scoped to a classroom. Its `exercise` rows each point at a problem and carry an integer `order`. The owner's controls live in `ManageLesson` (`manage-lesson.tsx`), which is rendered inside `LessonRoadmap` on `/classes/[classSlug]/lessons/[lessonSlug]`. Today those controls cover the due date, the show-outputs switch, publish, delete-draft, and add-exercise.

What already exists but is unused:
- `updateLesson({ title, description })`: the server action takes these fields, but no UI sends them.
- `reorderExerciseEntry({ exerciseId, order })` and `deleteExerciseEntry(id)`, with hooks in `use-exercise-entry.tsx`: nothing renders controls for them.

`createLesson({ classroomId })` always inserts the default "Untitled Assignment" title with slug `untitled-assignment-<hash>`, then redirects to the new lesson.

`EditClassDialog` (`edit-class-dialog.tsx`) is the established pattern for small rename dialogs: a Dialog with a controlled Input, `LoadingSwap` on confirm, and an error toast.

## Goals / Non-Goals

**Goals:**
- A professor names an assignment when creating it and can rename it or change its description later.
- A professor can reorder the exercises in an assignment and remove exercises from a draft.
- The UI shows the new title everywhere it appears (assignment page and class page lesson cards) without a reload.

**Non-Goals:**
- Changing an exercise's underlying problem in place. The professor removes the exercise and adds another.
- Drag-and-drop reordering. Up/down buttons are enough at typical assignment sizes of fewer than 15 exercises.
- Unpublish UI. It wasn't requested and stays out of scope.
- Changing the slug on rename.
- Moving the due-date and show-outputs controls into the edit dialog. They stay inline where they are.

## Decisions

### 1. Slug is fixed at creation and not regenerated on rename
Create derives the slug from the title through `generateSlug(title)`. Rename doesn't touch it.
- *Why:* professors share assignment URLs with students, and the slug already carries a random suffix, so a stale human-readable prefix does no harm.
- *Alternative:* regenerate the slug on every rename. Rejected because it breaks shared links and open tabs.

### 2. Create flow becomes a dialog, and the lesson row is inserted only on confirm
`CreateLessonButton` opens a dialog with a Title input (required) and a Description textarea (optional). On confirm it calls `createLesson({ classroomId, title, description })` and redirects as it does now.
- *Alternative:* keep instant create and auto-open the edit dialog on the new page. Rejected because cancelling would leave an orphan "Untitled Assignment" draft behind.
- The DB default `"Untitled Assignment"` stays in place, so no migration is needed. The action now always passes a title.

### 3. Shared `EditLessonDialog`, triggered from the page header action area
New `edit-lesson-dialog.tsx`, modelled on `EditClassDialog`, with title and description fields. It sits next to the "Review answers" button in `PageHeader.action` for the owner only, and works for both draft and published assignments. It sends only the fields that changed. If neither field changed, it closes without making a request.

### 4. Server-side title validation
`createLesson` and `updateLesson` trim `title`. If it's empty after trimming (when provided), they throw `"Title is required"`. A max length of 120 characters is enforced on both server and client to keep headers from overflowing. Description is trimmed but can be empty.

### 5. Reorder through a swap action instead of setting absolute order
Add `moveExerciseEntry({ exerciseId, direction: "up" | "down" })` to `create-exercise.ts`. It runs in a single `db.transaction`:
1. It loads every exercise of the lesson, ordered by `(order, createdAt)`.
2. If the `order` values aren't already distinct and contiguous, it renumbers them `0..n-1`, because legacy rows can have `order` ties at the default `0`.
3. It swaps the target's `order` with its neighbour's. Moving the first exercise up or the last one down does nothing.

The owner check matches the other exercise actions. The existing `reorderExerciseEntry` action and hook are replaced by `moveExerciseEntry` / `useMoveExerciseEntry`, since nothing else calls them.
- *Alternative:* have the client compute the new orders and call `reorderExerciseEntry` twice. Rejected because it isn't atomic and breaks on tied orders.

### 6. Removing exercises is allowed on drafts only
`deleteExerciseEntry` loads the lesson and throws `"Unpublish this assignment before removing exercises."` when `lesson.isPublished`. Deleting an exercise cascades `exercise_completion` (student answers and professor feedback) and its constraints. That matches the existing rule that published lessons can't be deleted outright (`deleteLesson`). In the UI, the remove button is only rendered for drafts and opens an AlertDialog to confirm.

### 7. Cache invalidation
Following the `mutation-cache-invalidation` skill:
- `useCreateLesson` invalidates `["classes", classroomId]`, which by prefix also covers `["classes", classroomId, "lessons"]`.
- `useUpdateLesson` invalidates `["lessons", lessonId]` and `["classes"]`, because lesson cards on the class page show the title. The hook input stays keyed by `lessonId`, so a prefix-wide invalidation of `["classes"]` is the simplest correct choice.
- `useMoveExerciseEntry` and `useDeleteExerciseEntry` invalidate `["lessons", lessonId]` as they do now. Delete also invalidates `["classes"]`, because the class page shows exercise counts.

## Risks / Trade-offs

- [Professor wants to drop an exercise from an assignment that's already published] → Unpublish isn't in scope, so the professor can't do it. The error message says why. If this comes up in practice, a follow-up can add unpublish or a soft "hidden" flag on the exercise.
- [Renumbering on first move rewrites `order` for every exercise in the lesson] → Exercise counts are tiny and the work runs in one transaction. Ordering in the result doesn't change, because `(order, createdAt)` determined the displayed order already.
- [`get-lesson` orders by `order` only, so ties render in arbitrary order] → Add `createdAt` as a secondary sort in `get-lesson.ts` so the displayed order matches the order the move action assumes.
