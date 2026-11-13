## Why

On the teacher class detail page (`/classes/[slug]`) the header puts five action buttons (class code copy, Gradebook, Edit class, Create assignment, Delete class) in the same row as the title. The buttons claim all the width, so a normal class name like "Programação 1 - TecInfo1 - 2026" wraps word by word into a narrow column, the button row overflows past the content edge, the icon badge drifts off the title, and the red Delete class button carries the same weight as the primary action.

## What Changes

- The title row (icon badge, class name, student count) uses the shared `PageHeader` with no inline actions, so the name gets the full content width and wraps naturally.
- Teacher actions move to a toolbar row under the header: a compact copyable class-code chip on the left; Gradebook and **Create assignment** (the primary, filled button) on the right, followed by an ellipsis overflow menu.
- The overflow menu holds Edit class, Leave class (co-teachers) and Delete class (owner, destructive style). Each opens the same dialog as before.
- The toolbar wraps cleanly at mobile width; no horizontal overflow.
- Students keep a single Leave class button, now in the same toolbar position.
- `PageHeader`: icon badge no longer shrinks and the title block gets `min-w-0` + word breaking, so long titles never squeeze the icon or overflow (no visual change for short titles on other pages).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `classes`: adds a requirement for the class detail header layout (full-width title, action toolbar, primary create action, destructive actions in an overflow menu, no horizontal overflow on mobile).

## Impact

- `web/app/[locale]/classes/_components/class-detail.tsx`, `edit-class-dialog.tsx`, `delete-class-dialog.tsx`, `leave-class-button.tsx`, `create-lesson-button.tsx` (dialogs gain an optional controlled mode without their own trigger).
- `web/components/page-header.tsx` (shrink/overflow guards only).
- i18n: `ClassesPage.moreActions` in `web/messages/en.json` and `br.json`.
- No DB, judge or server-action changes.
