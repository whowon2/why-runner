## Why

The command palette (navigation, create actions, theme/language switching, problem/contest search) only opens via Ctrl+K / ⌘K, and nothing in the UI says so. New users — including students in the TCC classroom study — never discover it, so its whole feature set is effectively hidden.

## What Changes

- Add a palette trigger button to the bottom dock (search icon), visible to signed-in and signed-out visitors, that opens the command palette on click/tap.
- The trigger's tooltip shows the label plus the platform-correct shortcut (`⌘K` on Apple platforms, `Ctrl K` elsewhere) rendered as keycaps.
- Add a small reusable `Kbd` UI primitive for keycap rendering.
- Lift `CommandPaletteProvider` so both the palette and the dock share the same open state (the dock currently renders outside the provider).
- New i18n strings in `en.json` and `br.json` for the trigger label.

## Capabilities

### New Capabilities
- `command-palette-discoverability`: how the UI advertises and exposes the command palette (dock trigger, shortcut hint, platform-specific key label).

### Modified Capabilities
<!-- none: no existing command-palette spec; dock behavior in `language-switching` is unaffected -->

## Impact

- `web/components/user-dock.tsx` — new trigger `DockIcon`.
- `web/components/command-palette/command-palette-mount.tsx`, `web/app/[locale]/layout.tsx` — provider wraps the dock as well as the palette.
- `web/components/ui/kbd.tsx` — new primitive.
- `web/messages/en.json`, `web/messages/br.json` — new keys.
- No server, DB, or judge changes.
