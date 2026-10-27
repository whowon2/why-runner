## Context

The palette lives in `web/components/command-palette/`. `CommandPaletteMount` (rendered in `app/[locale]/layout.tsx`) creates `CommandPaletteProvider` and renders only the shortcut hook and the dialog inside it. The global navigation is the bottom `UserDock` (`components/user-dock.tsx`), rendered as a *sibling* of `CommandPaletteMount`, so it cannot call `useCommandPalette()` today. The dock already wraps items in `Tooltip`s and only renders after mount (`mounted` guard), so client-only values like the platform are safe to read there.

## Goals / Non-Goals

**Goals:**
- A visible, always-present entry point to the palette that also teaches the shortcut.
- Correct modifier key per platform.
- Works on touch devices (button, not just a hint).

**Non-Goals:**
- Onboarding tour / first-visit toast.
- Changing the shortcut or palette contents.
- A full-width search bar in a top header (app has no top header).

## Decisions

**1. Dock trigger button with tooltip, not a static text hint.**
A button is useful on mobile (where Ctrl+K is meaningless) and discoverable on desktop; the tooltip teaches the shortcut so power users graduate to it. Alternatives: a fixed "Press Ctrl K" footer hint (dead weight on mobile, easy to ignore), a first-visit toast (one-shot, needs persistence). Place it as the first item after the nav separator, before theme toggle, using lucide `Search` icon.

**2. Lift the provider instead of a global event.**
Wrap the layout's `CommandPaletteMount` + `UserDock` in `CommandPaletteProvider` (e.g. make `CommandPaletteMount` accept `children`, or move the provider into the layout around both). Keeps one `open` state; the trigger calls `setOpen(true)`. Alternative: dispatch a synthetic keydown / custom DOM event — hacky and bypasses React state.

**3. `Kbd` primitive in `components/ui/kbd.tsx`.**
Small `<kbd>` with muted bg, border, `font-mono text-xs`, matching shadcn's `Kbd`. Reusable later in palette footer/other hints. `input-group.tsx` already styles `kbd` children, so this fits.

**4. Platform detection client-side.**
`navigator.userAgentData?.platform ?? navigator.platform`, regex `/mac|iphone|ipad|ipod/i` → `⌘`, else `Ctrl`. Computed inside the dock (already post-mount) so no hydration mismatch. Extract into a tiny helper (e.g. `command-palette/shortcut-label.ts`) so the palette can reuse it.

**5. i18n.**
Add `CommandPalette.open` (en "Search & commands", br "Buscar e comandos") used for both tooltip text and `aria-label`.

## Risks / Trade-offs

- [Dock gets one more icon, more crowded on small phones] → icon-only, same size as others; verify at 360px width.
- [`navigator.platform` deprecated] → prefer `userAgentData` with fallback; wrong guess only mislabels the hint, shortcut accepts both modifiers anyway.
- [Provider move could re-render the dock on palette open/close] → context value is memoized; dock re-render is cheap.
