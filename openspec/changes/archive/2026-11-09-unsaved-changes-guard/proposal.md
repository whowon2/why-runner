## Why

In the classroom test (2026-10-29) the professor lost problem edits by leaving
the problem editor without clicking "Salvar rascunho": nothing warned them.
They also noticed that some screens save on their own and others need a Save
click (professor survey P5, SUS item 6 "inconsistent" = 3, the weakest score).
There is no `beforeunload` or route-leave guard anywhere in `web/` today.

## What Changes

- New app-wide unsaved-changes guard: a form registers "I have unsaved edits";
  while any registered form is dirty:
  - closing/reloading the tab or typing a new URL shows the browser's native
    "leave site?" prompt (`beforeunload`);
  - in-app navigation (any `<a>`/`Link` click, every `router.push`/`replace`/
    `back`/`forward` from `@/i18n/navigation`, which covers tabs, the command
    palette and the language switcher) and the browser Back/Forward buttons
    open a localized "Discard unsaved changes?" dialog (Stay / Leave without
    saving).
- Guard applied to every explicit-save form that holds more than one edit:
  problem editor, contest settings, profile form, lesson exercise
  constraints (structural rows + algorithm requirement), survey answers.
- Problem editor fixes needed for a truthful dirty state: a brand-new problem
  is no longer dirty on load (the blank first test moves into the defaults);
  the form resets to the saved values after a successful save; Save is
  disabled until there is something to save and an "Unsaved changes" hint
  shows next to it; Publish warns when the form has unsaved edits (it would
  publish the last saved version).
- Profile form resets to the saved values after a successful save (today it
  stays dirty forever).
- One documented save rule for every screen (design.md, "Save rule"):
  single controls save on change, multi-field forms and free text save
  explicitly with a guarded Save button, dialogs commit or cancel.

## Capabilities

### New Capabilities

- `unsaved-changes-guard`: the save rule, the leave guard (native prompt for
  unloads, in-app dialog for navigation and Back/Forward), which forms
  register with it and how dirtiness is defined.

### Modified Capabilities

(none: the problem editor and other forms keep their behavior and fields; the
new requirements live in `unsaved-changes-guard`.)

## Impact

- `web/i18n/navigation.ts`: `useRouter` becomes the guarded router (same API).
- New `web/components/unsaved-changes/` (provider, hook, dialog), mounted in
  `web/providers/index.tsx`.
- Forms: `problems/_components/create.tsx`, `problems/_components/publish-button.tsx`,
  `contests/_components/tabs/settings/form.tsx`, `user/_components/form.tsx`,
  `classes/_components/exercise-constraints.tsx`,
  `surveys/_components/survey-form.tsx`.
- `web/messages/{br,en}.json`: dialog and hint strings.
- No DB, server action or judge changes. Web minor version bump (new feature).
