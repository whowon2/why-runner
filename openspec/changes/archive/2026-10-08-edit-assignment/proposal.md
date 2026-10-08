## Why

A professor's assignment (`lesson`) can't really be edited today. `createLesson` always inserts "Untitled Assignment", and although the `updateLesson` server action accepts `title`/`description`, no UI exposes them, so every assignment students see is titled "Untitled Assignment". The `deleteExerciseEntry`/`reorderExerciseEntry` actions and hooks exist too, but nothing calls them. Once an exercise is added, the professor can't remove it or change its position.

## What Changes

- Creating an assignment opens a dialog that asks for a title (required) and a description (optional) before the lesson is created. The slug comes from the title instead of `untitled-assignment`.
- An "Edit assignment" dialog on the assignment page lets the owner change the title (required, non-empty) and description, for both draft and published assignments. The slug stays the same so existing links keep working.
- The owner's exercise list gets move up/down controls (reorder) and a remove button with a confirmation dialog.
- Exercises can be removed only while the assignment is a draft. On a published assignment the server action rejects removal, because deleting an exercise cascades away students' `exercise_completion` rows and feedback. Reordering stays allowed on published assignments.
- `createLesson` and `updateLesson` trim the title and reject an empty one on the server.
- `useUpdateLesson` also invalidates the class's lesson list (`["classes", classroomId, "lessons"]`), so a renamed assignment shows its new title on the class page.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `lesson-track-authoring`: assignment creation now requires a title, and owners can edit title/description after creation. Exercise removal is limited to drafts, and reordering is explicitly supported.

## Impact

- `web/lib/actions/lessons/create-lesson.ts`: accepts `title` and optional `description`, validates them, and derives the slug from the title.
- `web/lib/actions/lessons/update-lesson.ts`: validates `title` (trimmed, non-empty).
- `web/lib/actions/lessons/create-exercise.ts`: `deleteExerciseEntry` rejects removal when the lesson is published. `reorderExerciseEntry` swaps with the neighbouring exercise.
- `web/hooks/use-create-lesson.tsx`, `web/hooks/use-update-lesson.tsx`, `web/hooks/use-exercise-entry.tsx`: new input shapes and wider invalidation.
- `web/app/[locale]/classes/_components/create-lesson-button.tsx`: becomes a dialog.
- New `web/app/[locale]/classes/_components/edit-lesson-dialog.tsx`.
- `web/app/[locale]/classes/_components/lesson-roadmap.tsx` and `manage-lesson.tsx`: edit button, plus reorder/remove controls for the owner.
- `web/messages/en.json` and `web/messages/br.json`: new strings.
- No DB schema change and no migration. Judge is unaffected.
