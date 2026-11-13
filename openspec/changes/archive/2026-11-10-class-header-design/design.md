## Context

`PageHeader` (`web/components/page-header.tsx`) is the shared title component (icon badge, title, subtitle, optional `action`). Its `action` slot sits beside the title on `sm+`, which suits one or two buttons (problems, contests) but not the class page's five or six.

## Decisions

- **Keep `PageHeader`, drop its `action` on this page.** The title row stays identical to other pages (design-system spec). Actions go into a separate toolbar `div` below it instead of widening `PageHeader`'s API for one page.
- **Overflow menu via `DropdownMenu`.** Edit/Leave/Delete dialogs get optional `open` / `onOpenChange` props; when controlled they render no trigger, and the menu item opens them. The menu's `onCloseAutoFocus` is prevented: otherwise focus snaps back to the ellipsis trigger right after the item opens a dialog, Radix treats that as focus outside the dialog and closes it at once (seen in the browser check). Dialogs are rendered outside the menu so closing the menu does not unmount them.
- **Class code chip**: an outline `Button` `size="sm"` showing `Copy` icon + monospace code, with the "Class code" label as `title`/`aria-label` rather than visible text, to stay compact.
- **Primary action**: Create assignment uses the default (filled) button variant; Gradebook stays outline.

## Risks

- Dialogs that were uncontrolled now support both modes; the existing uncontrolled path stays the default so other callers (none today) keep working.
