## Why

Every user setting except notifications lives in `localStorage`: light/dark mode, the theme preset or custom colors, and the editor's font size and auto-close toggle. Students switch machines (lab PCs, home), so their settings don't follow them. There is also no place to configure the code editor beyond two toolbar buttons (no vim keybindings, tab size, word wrap, etc.).

## What Changes

- New `user_preference` table, one row per user, holding every user setting: color mode (light/dark/system), theme (preset id or custom tokens), and editor settings. Notification preferences keep their own table.
- For signed-in users the database becomes the source of truth. `localStorage` stays as a mirror, so the pre-paint theme script and editor still read settings synchronously with no flash. On load, the server's values overwrite the mirror.
- On first sign-in, when the user has no row, the row is seeded from the browser's current `localStorage` values, so existing users keep their settings.
- Signed-out visitors keep today's `localStorage`-only behavior.
- New **Editor** section on `/settings` with font size, auto-close brackets/quotes, vim keybindings, tab size, word wrap, line numbers (on / off / relative) and minimap.
- Vim keybindings via the `monaco-vim` package, loaded only when enabled, with a mode/command status line under the editor. Emacs is not included.
- In vim mode, Esc inside the editor no longer leaves fullscreen. The toggle button still does.
- The existing editor toolbar font-size and auto-close controls, the dock's light/dark toggle, the command palette's theme commands and the Appearance section all write through the new preferences layer.
- i18n strings in `en.json` and `br.json`. `web/package.json` minor bump (1.4.0 → 1.5.0).

## Capabilities

### New Capabilities
- `user-preferences`: server-side storage of per-user settings, the `localStorage` mirror, seeding on first sign-in, and the signed-out fallback.
- `editor-settings`: the `/settings` Editor section and the editor options it controls (vim, tab size, word wrap, line numbers, minimap, plus font size and auto-close).

### Modified Capabilities
- `code-editor-controls`: font size and auto-close persist per account (DB) for signed-in users instead of only in `localStorage`. With vim on, Esc inside the editor doesn't leave fullscreen.
- `theme-customization`: theme and light/dark persistence moves from client-only to per account, with `localStorage` kept as the pre-paint cache.

## Impact

- **DB**: new table + migration `0053_user_preferences.sql`. Parallel worktrees share one Postgres DB, so a branch also adding 0053 would collide.
- **Code**: `web/drizzle/schemas/users.ts` (or a new `preferences.ts`), new `web/lib/actions/preferences/`, new `web/hooks/use-user-preferences.tsx`, `web/providers/` (new preferences sync + `theme-tokens-provider.tsx`), `web/hooks/use-editor-font-size.tsx`, `web/hooks/use-editor-auto-close.tsx`, `web/components/code-editor.tsx`, `web/components/user-dock.tsx`, `web/components/command-palette/`, `web/app/[locale]/settings/_components/`.
- **Dependencies**: adds `monaco-vim`.
- **Judge**: no change.
