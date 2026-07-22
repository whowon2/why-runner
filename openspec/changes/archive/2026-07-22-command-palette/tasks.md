## 1. Setup

- [x] 1.1 Add `cmdk` dependency to `web/package.json`
- [x] 1.2 Create `web/components/ui/command.tsx` (shadcn-style Radix Dialog + cmdk wrapper, matching existing `dialog.tsx` conventions)

## 2. Command registry & state

- [x] 2.1 Create `web/components/command-palette/commands.ts` with typed `Command` shape (`id`, `group`, `labelKey`, `icon`, `action`) and static list for navigation/create/account/theme groups
- [x] 2.2 Create palette open/close context or hook (`web/components/command-palette/palette-context.tsx` or similar) shareable across app
- [x] 2.3 Create `useCommandPaletteShortcut` hook: global `keydown` listener for `Cmd/Ctrl+K`, ignoring text-input targets already capturing the combo, toggling palette state

## 3. Palette UI

- [x] 3.1 Build `web/components/command-palette/command-palette.tsx`: renders `command.tsx` primitive, grouped command list, search input, empty state
- [x] 3.2 Wire keyboard navigation (arrow up/down, wrap, Enter to select, Esc to close) via cmdk defaults; verify focus returns to prior element on close
- [x] 3.3 Implement nested "Change theme" sub-list using cmdk pages, applying selection via existing theme-customization mechanism (check `/settings` theme code for the apply function to reuse)

## 4. Command wiring

- [x] 4.1 Wire navigation commands (home, problems, contests, roadmap, settings, profile) using `useRouter`/`Link` helpers from `web/i18n/navigation.ts`
- [x] 4.2 Wire "New problem" command to navigate to `problems/new`
- [x] 4.3 Inspect `web/app/[locale]/contests/_components/create/dialog.tsx` for its trigger mechanism; wire "New contest" command to open it from the palette (query param, shared state, or navigate+auto-open)
- [x] 4.4 Wire "Log out" command to `authClient.signOut()` (reuse pattern from `web/components/header/avatar-button.tsx`); filter command out when no session
- [x] 4.5 Filter/gate command visibility by auth session where applicable

## 5. Mounting & i18n

- [x] 5.1 Mount palette provider + `CommandPalette` component + shortcut hook once in `web/app/[locale]/layout.tsx`
- [x] 5.2 Add `CommandPalette` translation namespace (search placeholder, empty state, group labels, command labels) to `web/messages/en.json` and `web/messages/br.json`

## 6. Verification

- [ ] 6.1 Manually test open/close via shortcut, click-outside, Esc, and re-toggle on every top-level route
- [ ] 6.2 Manually test fuzzy filtering, keyboard navigation, and selection for each command group
- [ ] 6.3 Manually test theme sub-list applies theme without closing to a blank state
- [ ] 6.4 Manually test logout command signs out and command is hidden when logged out
- [ ] 6.5 Verify locale switch (`en`/`br`) renders palette strings correctly

Note: no browser automation tool available this session (Claude in Chrome declined). Verified server-side: `tsc --noEmit` clean, `biome check` clean on touched files, and `/en`, `/en/problems`, `/en/contests`, `/en/settings` all return 200/redirect (no runtime crash) against the live dev server. 6.1-6.5 need a human to click through — Cmd/Ctrl+K, arrow nav, theme switch, logout visibility, and `br` locale.
