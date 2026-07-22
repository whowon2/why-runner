## Why

Nav today = clicks thru menus, dropdowns, page loads. Users (esp power/CP users) want fast keyboard-driven access: jump pages, spawn create-problem/create-contest flows, logout — no mouse hunting. Precedent: Zed/VSCode Cmd+K, MonkeyType palette, Raycast.

## What Changes

- Add global command palette, opened via keyboard shortcut (`Cmd/Ctrl+K`) from any page.
- Fuzzy-searchable list of commands, grouped: **Navigation** (home, problems, contests, roadmap, settings, profile), **Create** (new problem, new contest — opens existing dialogs/pages), **Account** (logout via `authClient.signOut()`), **Theme** (switch appearance theme, reuse existing theme-customization capability).
- New `cmdk`-based UI primitive `web/components/ui/command.tsx` (shadcn pattern, matches existing Radix-based `dialog.tsx`/`dropdown-menu.tsx` style already in repo).
- Global keyboard-shortcut listener mounted once in root layout (no such listener exists today).
- i18n: new `CommandPalette` namespace added to `web/messages/en.json` and `web/messages/br.json`; all commands route through `web/i18n/navigation.ts`.
- No "edit configs" backend — config edits routed to existing settings pages/dialogs (no new config-mutation capability introduced here; palette is a navigation/launcher layer over what exists).

## Capabilities

### New Capabilities
- `command-palette`: global keyboard-invoked command launcher — open/close behavior, command registry (navigation/create/account/theme groups), fuzzy search/filter, keyboard navigation and selection, extensibility contract for registering new commands.

### Modified Capabilities
(none — palette only invokes existing flows: create-problem page, create-contest dialog, signOut, theme-customization; no existing spec's requirements change)

## Impact

- New deps: `cmdk` (added to `web/package.json`).
- New files: `web/components/ui/command.tsx`, `web/components/command-palette/*` (palette component, command registry), keyboard listener hook.
- Modified: root layout (`web/app/[locale]/layout.tsx`) to mount palette + listener; `web/messages/en.json`, `web/messages/br.json` for new strings.
- Reused, unmodified: `web/lib/actions/problems/create-problem.ts`, `web/lib/actions/contest/create-contest.ts`, `authClient.signOut()` (better-auth), `web/i18n/navigation.ts`, existing theme-customization capability.
