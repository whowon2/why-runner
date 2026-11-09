## 1. Guard infrastructure

- [x] 1.1 `components/unsaved-changes/`: registry store, provider, `useUnsavedChanges(id, isDirty)`, `allowNavigation`, `useHasUnsavedChanges(id?)`, `guardNavigation`, localized AlertDialog, `UnsavedChangesHint`
- [x] 1.2 `beforeunload` listener added only while any form is dirty
- [x] 1.3 Capture-phase document click listener for internal `<a>` links (skip modifiers, middle click, `_blank`, `download`, cross-origin, same path+search)
- [x] 1.4 `popstate` listener registered at module load (before the app router's) for Back/Forward (re-push current entry, dialog, bypass + `history.back()` on Leave)
- [x] 1.5 Wrap `useRouter` in `i18n/navigation.ts` (`push`/`replace`/`back`/`forward` ask the guard); mount provider in `providers/index.tsx`
- [x] 1.6 Messages `UnsavedChanges.*` in `messages/br.json` and `messages/en.json`

## 2. Explicit-save forms

- [x] 2.1 Problem editor: blank first test in `defaultValues`, `form.reset` after save, Save disabled until dirty + "Unsaved changes" hint, register `problem-editor`, post-save `router.replace` via `allowNavigation`
- [x] 2.2 Publish problem: block with "save first" while `problem-editor` is dirty
- [x] 2.3 Contest settings form: register guard (already resets and disables Save), add hint, slug redirect via `allowNavigation`
- [x] 2.4 Profile form: `form.reset` after save, register guard (icon Save in a dialog, no hint)
- [x] 2.5 Exercise constraints: structural rows and algorithm requirement register dirty vs saved values; Save disabled until dirty
- [x] 2.6 Survey form: register while answers touched and not submitted; never in preview

## 3. Verify and ship

- [x] 3.1 `bun lint`, `bunx tsc --noEmit`
- [x] 3.2 Browser check on DEV_PORT with the teacher account: problem editor (link click, tab switch, Back, reload, save-then-leave, rename redirect, ctrl-click, publish while dirty), contest settings tab switch, profile
- [x] 3.3 Bump `web/package.json` minor version
- [x] 3.4 Add row to `docs/evaluation/post-evaluation-changes.md` (the professor review lives on `docs/professor-survey-review`; P5 status is updated there, not here)
- [x] 3.5 Archive the change
