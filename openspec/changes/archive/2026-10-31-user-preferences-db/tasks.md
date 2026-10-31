## 1. Database

- [x] 1.1 Add `drizzle/schemas/preferences.ts` with `user_preference` table (columns per design decision 1) + relation, export from `drizzle/schema.ts`
- [x] 1.2 `bun db:generate` → `0053_user_preferences.sql`; check numbering against `main`; `bun db:migrate` locally

## 2. Server actions

- [x] 2.1 Shared zod schema + TS types for the preferences patch (`lib/preferences.ts`: defaults, bounds, line-number/tab-size enums, `StoredTheme` validation with preset ids + hex tokens)
- [x] 2.2 `lib/actions/preferences/get-preferences.ts` (`getUserPreferences`, caller's row or null)
- [x] 2.3 `lib/actions/preferences/update-preferences.ts` (`updateUserPreferences`: auth, strict partial zod, upsert listed columns only)
- [x] 2.4 `seedUserPreferences` (in `update-preferences.ts`, sharing its parse helper): insert on conflict do nothing, return row
- [x] 2.5 Unit tests (`bun test lib`) for the zod schema: bounds, unknown keys, bad hex, unknown preset

## 3. Client preferences layer

- [x] 3.1 Local stores for new editor settings (vim, tab size, word wrap, line numbers, minimap) via `createLocalSetting`, alongside font size / auto-close
- [x] 3.2 `lib/preferences-sync.ts`: bindings, dirty set, debounced merged-patch save (toast on error, `pagehide` flush); successful saves merge into the `["preferences", userId]` cache (no refetch, so an in-flight change is not reverted)
- [x] 3.3 `PreferencesSync` in `providers/`: on session, fetch; apply non-dirty fields into local stores / `setTheme` / theme tokens; seed when row is null
- [x] 3.4 Persisting setters: editor setting hooks write local + enqueue patch; `ThemeTokensProvider` `setPreset`/`setCustomTokens` enqueue `theme`; a `useColorMode()` setter that calls `setTheme` + enqueues `color_mode`
- [x] 3.5 Route committed mode changes through the persisting setter: `user-dock.tsx`, command palette select (`command-palette.tsx`, `commands.ts`), Appearance section, workspace Settings drawer; leave previews on raw `setTheme` / `previewPreset`

## 4. Code editor

- [x] 4.1 Apply tab size (`detectIndentation: false`, `insertSpaces: true`), word wrap, line numbers, minimap in `components/code-editor.tsx`
- [x] 4.2 Add `monaco-vim` (exact version), keep editor instance from `onMount` (compose caller's), lazy-load + init/dispose vim on toggle, status line under editor
- [x] 4.3 Fullscreen Esc handler: skip when vim is on and the event target is inside the editor

## 5. Settings page

- [x] 5.1 Add `"editor"` to `SettingsSection` + nav item (`Code` icon); switch in `settings-content.tsx`
- [x] 5.2 `editor-section.tsx`: font size −/+, auto-close switch, vim switch, tab size segmented, word wrap switch, line numbers segmented, minimap switch
- [x] 5.3 i18n: `SettingsPage.nav.editor`, `SettingsPage.editor.*`, save-error toast, vim status labels in `messages/en.json` and `messages/br.json`
- [x] 5.4 Shared `components/editor-settings-controls.tsx`, used by the Editor section and the workspace Settings drawer

## 6. Wrap-up

- [x] 6.1 Bump `web/package.json` 1.4.0 → 1.5.0
- [x] 6.2 Update `web/CLAUDE.md` (schema list: `user_preference`; preferences flow)
- [x] 6.3 `bun lint`, `bun test lib`, `bun run build`
- [x] 6.4 Browser check with test accounts: settings sync between two browsers/profiles, seeding, signed-out fallback, vim in fullscreen, preview not persisted
