## Context

Today, settings live in three places in the browser:

- Light/dark: `next-themes`, `localStorage["theme"]`. It is set from the user dock toggle (`components/user-dock.tsx`), the command palette (`components/command-palette/command-palette.tsx`, `commands.ts`, which also *previews* modes by calling `setTheme` and restoring it), and the Appearance section.
- Theme tokens: `ThemeTokensProvider` + `lib/themes/storage.ts`, `localStorage["why-runner:theme"]` (`StoredTheme`: `{mode:"preset",presetId}` or `{mode:"custom",custom:{light,dark}}`). Custom colors are written on every keystroke and color-picker drag. `previewPreset` is transient.
- Editor: `createLocalSetting` (`hooks/use-local-setting.ts`), a `useSyncExternalStore` store with cross-tab `storage` events. Keys are `whyrunner:editor-font-size` and `whyrunner:editor-auto-close`.

`app/[locale]/layout.tsx` has an inline `THEME_INIT_SCRIPT` that reads both theme keys before paint. The layout doesn't read the session. Notification preferences already live in the DB (`notification_preference`, React Query + optimistic update). That's the pattern to follow.

There is one `<CodeEditor>` call site, `components/workspace/code-pane.tsx`, used by the problem, contest problem and lesson exercise workspaces. Fullscreen is inside `CodeEditor`, which doesn't currently take an `onMount` from callers.

## Goals / Non-Goals

**Goals:**
- Settings follow the account across devices.
- No theme flash on a known browser, and no regression for signed-out visitors.
- One preferences layer that every setter goes through.
- Editor section with vim + the other Monaco options.

**Non-Goals:**
- Emacs keybindings, font family, a vim `:w`→submit mapping, custom vimrc.
- Server-rendering the theme from the DB (zero flash on new devices). That would make the layout read the session on every request.
- Moving notification preferences, code drafts, console-collapsed state, AI hint cache or survey dismissals. The last four are caches/UI state, not settings.
- Clearing local settings on sign-out.

## Decisions

**1. One row, typed nullable columns: `user_preference`.**
Columns: `user_id text PK → user.id ON DELETE CASCADE`, `color_mode` (`light|dark|system` pg enum; the command palette offers system), `theme jsonb` (`StoredTheme`), `editor_font_size int`, `editor_auto_close bool`, `editor_vim bool`, `editor_tab_size int`, `editor_word_wrap bool`, `editor_line_numbers` (`on|off|relative`), `editor_minimap bool`, `updated_at`. NULL means "use the default", so adding a setting later is a nullable column with no backfill. Naming is singular to match `notification_preference`. Lives in a new `drizzle/schemas/preferences.ts`, exported from `drizzle/schema.ts`. Migration via `bun db:generate` → `0053_user_preferences.sql`.
*Alternative*: a key/value table (one row per setting) is flexible but loses typing and makes validation stringly. A single `jsonb` blob was rejected for the same reason except `theme`, whose shape is nested and already modeled as `StoredTheme`.

**2. Server actions in `lib/actions/preferences/`.**
- `getUserPreferences()` returns the caller's row or `null`.
- `updateUserPreferences(patch)` takes a zod `.partial().strict()` object: font size int 10–32, tab size `2|4|8`, enums for mode/line numbers, `theme` as a discriminated union with `presetId` in `PRESETS` ids and hex-validated tokens via `isValidHexColor`. It upserts (`insert … onConflictDoUpdate`) only the listed columns and accepts explicit `null` to reset a field.
- Seeding uses the same `updateUserPreferences`. No separate action, because "insert if missing" is an upsert of the local values. To avoid overwriting a row another device created between get and seed, add `seedUserPreferences(values)` that does `onConflictDoNothing` and returns the resulting row. *My call.*

**3. Client: a `PreferencesSync` component inside `Providers`, with the local stores staying the runtime source.**
Each setting keeps (or gets) a local store: the existing `createLocalSetting` stores for editor settings (new ones added for vim/tab/wrap/line numbers/minimap), `next-themes` for mode, and `ThemeTokensProvider` for tokens. Components keep reading those synchronously, so nothing changes for the pre-paint script or signed-out visitors.
- **Writes**: one `usePreferenceSetter()`-style entry point per setting writes the local store, then, if signed in (`authClient.useSession`), queues a debounced (~500 ms, merged patch) `updateUserPreferences`. The debounce covers custom-color typing and font-size clicking.
- **Reads**: when signed in, `useQuery(["preferences"])` fetches the row once per session/page load. On success, for each non-null field not marked *dirty* (the user changed it locally since load), write it into the local store. Writing to the store re-renders the editors, `setTheme`, and the `ThemeTokensProvider` stored value.
- **Seeding**: if the row is `null`, read valid present local values and call `seedUserPreferences`.
- **Errors**: on save failure, keep the local value and `toast.error` (i18n). No retry queue.

*Alternative*: making React Query the store and deriving everything from it. That loses synchronous reads, the cross-tab sync and the signed-out path, and would need a separate local store anyway.

**4. Previews never persist.**
The command palette mode preview and `previewPreset` keep calling the raw `next-themes` `setTheme` / preview state. Only committed choices (dock toggle, palette select, Appearance buttons, preset click, custom form) call the persisting setter. Mode persistence is explicit, not "watch `theme` and save", so a preview can't leak into the DB.

**5. Vim via `monaco-vim` (pin exact version), dynamic `import()`.**
`CodeEditor` keeps the editor instance from `onMount` (composing any caller `onMount`). An effect on `[vim, editor]` lazy-imports `monaco-vim`, calls `initVimMode(editor, statusNode)`, and `dispose()`s on toggle-off/unmount. The status node is a small mono line under the editor, rendered only when vim is on. The editor model is untouched, so code, cursor and undo survive toggling. Fullscreen's Esc handler returns early when vim is on and `event.target` is inside the editor's DOM node.
`monaco-vim@0.4.4` (`vim-monaco` pins `monaco-editor <0.53`, the app loads 0.55). Its builds import `monaco-editor/esm/vs/editor/editor.api`, which would bundle a second Monaco next to the CDN-loaded one. `next.config.ts` aliases that specifier to `lib/monaco-global.ts`, re-exporting the global instance (`CodeEditor` sets `globalThis.monaco` from `beforeMount` before the lazy import). The browser (UMD) build inlines the `ShiftCommand` it needs.

**6. Monaco options mapping.**
`tabSize` + `detectIndentation: false` + `insertSpaces: true`, so the user's tab size wins over starter code. `wordWrap: "on"|"off"`. `lineNumbers: "on"|"off"|"relative"`. `minimap: { enabled }`. These are applied after caller `options`, like `fontSize` today. Defaults match current Monaco behavior: tab 4, wrap off, numbers on, minimap on, auto-close on, vim off, font 14.

**7. Settings UI.**
`SettingsSection` gains `"editor"` (lucide `Code` icon). `settings-content.tsx` switches on three values. `editor-section.tsx` follows `notifications-section.tsx` styling: header + bordered rows with `Switch`, segmented buttons (Appearance style) for tab size and line numbers, and −/value/+ for font size. Strings go under `SettingsPage.nav.editor` and `SettingsPage.editor.*` in `messages/en.json` and `messages/br.json`. The vim status line and the save-error toast go under `CodeEditor.*` / a shared key.

## Risks / Trade-offs

- [Brief flash on a new device for signed-in users] → Accepted by the user. Converges after the fetch, and only happens once per browser.
- [Seeding copies the previous user's local settings on a shared lab PC] → Harmless cosmetic data; only happens when the new account has no row yet.
- [Two devices editing concurrently: last write wins per field] → Acceptable for preferences. Patches are per-field, so different fields don't clobber each other.
- [Migration number collision with other worktrees sharing the DB] → Check `drizzle/migrations/` on `main` before merging and renumber if needed.
- [`monaco-vim` captures keys like Ctrl+R / Ctrl+V] → Only when vim is on, which is the expected behavior for vim users.
- [Debounced write lost if the tab closes within 500 ms] → Local value is still stored. Flush the pending patch on `pagehide` with a best-effort call.

## Migration Plan

1. Deploy the migration (additive table, no backfill).
2. Ship the web. Existing users seed their row from their browser on first load.
3. Rollback: revert the web. The table can stay (unused) or be dropped; `localStorage` still holds every value, so nothing is lost.

## Open Questions

None blocking.
