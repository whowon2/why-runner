## 1. Shared state

- [x] 1.1 Make `CommandPaletteProvider` wrap both the palette and `UserDock` in `web/app/[locale]/layout.tsx` (e.g. `CommandPaletteMount` accepts `children`)
- [x] 1.2 Confirm Ctrl+K / ⌘K still toggles the palette after the move

## 2. Primitives

- [x] 2.1 Add `web/components/ui/kbd.tsx` keycap component
- [x] 2.2 Add platform shortcut-label helper in `web/components/command-palette/` (`⌘` on Apple, `Ctrl` otherwise)

## 3. Dock trigger

- [x] 3.1 Add `CommandPalette.open` key to `web/messages/en.json` and `web/messages/br.json`
- [x] 3.2 Add `Search` `DockIcon` in `web/components/user-dock.tsx` (after nav separator, before theme toggle) calling `setOpen(true)`, with `aria-label`
- [x] 3.3 Tooltip shows localized label + `Kbd` keycaps for the platform shortcut

## 4. Verify

- [x] 4.1 `bun run lint` and `bun run build` (or typecheck) pass in `web/`
- [x] 4.2 Manually check: click opens palette (signed in and out), tooltip shows correct keys, dock fits at ~360px width, pt-BR label renders
