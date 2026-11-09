## Context

Professor survey P5 (classroom test 2026-10-29): leaving the problem editor
without "Salvar rascunho" silently drops the edits, and screens disagree on
whether they save by themselves. SUS item 6 ("inconsistent") scored 3, the
weakest item.

Inventory of how each editable screen saves today:

| Screen | Saves | Guard today |
|---|---|---|
| Settings: light/dark, preset, editor settings | on change (`savePreference`, debounced) | n/a |
| Settings: custom theme tokens | on blur (`flush`) | n/a |
| Settings: notification switches | on change | n/a |
| Lesson: due date | on change/blur | n/a |
| Lesson: exercise mode, test visibility mode, publish switches | on change | n/a |
| Code editors | `localStorage` draft per context (`useCodeDraft`) | n/a (restored on mount) |
| **Problem editor** (`/problems/[slug]/edit`) | explicit "Salvar rascunho", always enabled | **none** |
| **Contest settings** (`?tab=settings`) | explicit Save, disabled until dirty | **none** |
| **Profile form** | explicit Save, disabled until dirty, never resets after save | **none** |
| **Exercise constraints** (structural rows, algorithm requirement) | per-row Save button | **none** |
| **Survey answers** | explicit Submit at the end | **none** |
| Rename class / edit lesson / create dialogs | confirm button in dialog | dialog Cancel |

All app navigation goes through `@/i18n/navigation` (`Link`, `useRouter`);
no file imports `useRouter` from `next/navigation`. Next.js App Router has no
navigation-blocking API.

## Save rule

One rule, chosen by what the control edits, so a user can predict it:

1. **Save on change** — one control whose value is complete when picked
   (switch, select, checkbox, preset, a lone date or token). Saves at once,
   confirms with a toast/inline "saved", no Save button, nothing to guard.
2. **Explicit save + guard** — several fields or free text, where a half-typed
   state should never reach students (a published problem's tests, a
   contest's dates, a profile username that must be unique, a survey that is
   submitted once). One Save/Submit button, disabled until dirty, an
   "Unsaved changes" hint beside it, and the leave guard while dirty.
3. **Dialog** — small create/rename dialogs commit or cancel; closing is the
   explicit choice, so no guard.

The current screens already fit these buckets; this change adds the missing
half of rule 2 (guard + truthful dirty state + disabled Save) to the five
explicit-save screens.

**Alternative considered: autosave the problem editor.** Rejected: the editor
also edits *published* problems, so autosave would push half-typed tests and
statements to students mid-edit; a title change renames the slug and
redirects; each I/O change invalidates the validation run. Autosave would need
a server-side draft copy of the problem (schema change) to be safe. Explicit
save + guard fixes the reported data loss without that. Code drafts stay in
`localStorage` as today (they are per-user scratch, not shared content).

## Decisions

### Registry + provider

`UnsavedChangesProvider` (in `providers/index.tsx`) holds a map
`id → isDirty`. Forms call `useUnsavedChanges(id, isDirty)`; it sets the entry
on change and removes it on unmount. `useHasUnsavedChanges(id?)` reads it
(Publish uses `"problem-editor"`). The provider owns the `beforeunload`
listener, the link-click listener, the popstate listener and the dialog.
The registry is also mirrored in a module-level ref so the router wrapper and
listeners read the live value synchronously, not a stale render.

### beforeunload only while dirty

Add the listener when the first form becomes dirty, remove it when none is
(registering it unconditionally disables bfcache in some browsers). Handler
calls `preventDefault()` and sets `returnValue = ""`; the browser shows its own
text (custom text is ignored by every modern browser).

### In-app navigation: three entry points

- **Links**: one `click` listener on `document` in the capture phase. It
  intercepts a primary-button click without modifiers on an `<a href>` whose
  target is not `_blank`, has no `download`, is same-origin, and whose
  path+search differs from the current one (hash-only changes pass). It calls
  `preventDefault()` + `stopPropagation()` so Next's `Link` handler never runs,
  opens the dialog, and on Leave calls the raw router's `push(href)`.
  Alternative (wrapping `Link`) rejected: plain `<a>` in markdown and
  components would escape it.
- **Programmatic**: `i18n/navigation.ts` exports a wrapped `useRouter` with
  the same API; `push`/`replace`/`back`/`forward` ask the provider first
  (`confirmNavigation(run)`). Every existing call site (tabs, palette,
  language switcher, list filters) is covered with no edits. `refresh` and
  `prefetch` pass through.
- **Back/Forward**: a `popstate` listener on `window` added once when
  `components/unsaved-changes/store.ts` first loads. Chrome runs window
  listeners in registration order (a capture listener does not jump ahead at
  the target; verified in the browser), and the app router adds its own
  listener in an effect on mount, so only a listener registered at module
  load runs first. While dirty it calls `stopImmediatePropagation()`,
  re-pushes the page we were on (`history.pushState(savedState, "",
  savedUrl)`, captured when the guard engaged; the state carries `__NA` so
  Next's patched `pushState` passes it through untouched) and opens the
  dialog; Leave sets a one-shot bypass flag and calls `history.back()`, which
  lands on the target for Back and Forward alike (the re-push dropped the
  forward entries). Entries with the same path+search (hash changes) pass.

### Bypass for the form's own navigation

`allowNavigation(fn)` (exported next to `useUnsavedChanges`) runs `fn` with the
guard off for that synchronous call. The problem editor wraps its
post-save `router.replace` (slug rename) in it, since `form.reset()` only
updates the registry on the next effect.

### Dirty state per form

- react-hook-form forms use `formState.isDirty` (deep compare to defaults).
  After a successful save they call `form.reset(savedValues)`. The problem
  editor puts the initial blank test in `defaultValues` instead of appending
  it in an effect (which made every new problem dirty on load).
- Exercise constraints: each row compares its local state to the saved
  params; the algorithm requirement compares to `existing?.description`.
  Each registers its own id (`constraint:<id>`, `algorithm:<exerciseId>`).
- Survey: dirty once any answer or the consent box is touched, until it is
  submitted; preview (`entityId === null`) never registers.

### Dialog

One `AlertDialog` rendered by the provider, strings in
`UnsavedChanges.{title,description,stay,leave}`; Stay is the focused default
and Escape/overlay cancel. Concurrent requests replace the pending one.

## Risks / Trade-offs

- [Next internals: popstate ordering] The guard relies on its listener being
  registered before the app router's. → Registered at module load; a hot
  reload swaps only the handler behind the same listener. If Next ever moves
  its listener earlier, Back degrades to "no prompt", never to a broken page.
- [Re-pushed state drifts] Next may `replaceState` after we capture state. →
  Recapture state on every guard engagement and in the click listener path; a
  stale state only costs a soft reload of the same URL.
- [Links built with `window.location`/`<form action>`] Not intercepted; none
  exist in the guarded pages. beforeunload still covers full loads.
- [Two dirty forms on one page] The dialog appears once; Leave discards all.

## Migration Plan

Client-only, no DB/API change. Ship with a web minor bump (1.10.0). Rollback = revert.

## Open Questions

None.
