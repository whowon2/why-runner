## 1. Server actions

- [x] 1.1 Add a shared `normalizeLessonTitle(title)` helper in `web/lib/actions/lessons/` that trims the title, throws "Title is required" when it's empty, and throws when it's longer than 120 characters
- [x] 1.2 `createLesson`: accept `{ classroomId, title, description? }`, validate the title, trim the description, set the slug with `generateSlug(title)`, and persist the title and description
- [x] 1.3 `updateLesson`: when `title` is provided, run it through `normalizeLessonTitle`, and trim `description`
- [x] 1.4 `deleteExerciseEntry`: throw "Unpublish this assignment before removing exercises." when `found.lesson.isPublished`
- [x] 1.5 Replace `reorderExerciseEntry` with `moveExerciseEntry({ exerciseId, direction })`: run the owner check, then in a transaction load siblings ordered by `(order, createdAt)`, renumber them `0..n-1` if they aren't already contiguous, swap with the neighbour, and do nothing at the edges
- [x] 1.6 `get-lesson.ts`: add `createdAt` as a secondary sort for exercises

## 2. Hooks (follow mutation-cache-invalidation skill)

- [x] 2.1 `useCreateLesson`: widen the input to `{ classroomId, title, description? }` and keep the `["classes", classroomId]` invalidation
- [x] 2.2 `useUpdateLesson`: also invalidate `["classes"]` so class-page lesson cards show the new title
- [x] 2.3 Replace `useReorderExerciseEntry` with `useMoveExerciseEntry(lessonId)`, which invalidates `["lessons", lessonId]`
- [x] 2.4 `useDeleteExerciseEntry`: also invalidate `["classes"]` for exercise counts

## 3. UI

- [x] 3.1 Convert `create-lesson-button.tsx` into a dialog with a required Title input and an optional Description textarea. Disable confirm while the title is blank, support Enter to submit, and redirect to the new lesson on success
- [x] 3.2 Create `edit-lesson-dialog.tsx`, modelled on `EditClassDialog`, with title and description fields that are prefilled when the dialog opens. Send only the changed fields, close without a request when nothing changed, and show errors in a toast
- [x] 3.3 `lesson-roadmap.tsx`: render `EditLessonDialog` in the `PageHeader` action area next to "Review answers", for the owner only
- [x] 3.4 `lesson-roadmap.tsx`: for the owner, add up and down icon buttons to each exercise row (disabled on the first and last rows and while a move is pending), wired to `useMoveExerciseEntry`
- [x] 3.5 `lesson-roadmap.tsx`: for the owner of a draft lesson, add a remove icon button that opens an AlertDialog and calls `useDeleteExerciseEntry`, with success and error toasts
- [x] 3.6 Add i18n strings to `web/messages/en.json` and `web/messages/br.json` (edit assignment, title and description labels and placeholders, move up, move down, remove exercise title, description, and success, title required)

## 4. Verification

- [x] 4.1 Run `oxlint` and `tsc --noEmit` and confirm they pass
- [ ] 4.2 Manual check as the professor: create an assignment with a title and confirm the slug and header; rename it and confirm the class page card updates without a reload; reorder exercises including edge clicks; remove an exercise from a draft; confirm the remove button is absent on a published assignment and that a direct action call is rejected
- [ ] 4.3 Manual check as a student: open the renamed published assignment through the old URL and confirm it still resolves and shows the new title
