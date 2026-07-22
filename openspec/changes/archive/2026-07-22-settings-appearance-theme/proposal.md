## Why

WhyRunner has no settings page and only a single hardcoded light/dark theme (toggled via `next-themes` in `components/user-dock.tsx`). Users have no way to personalize the site's look, and there's no central place for account-level preferences. A Monkeytype-style appearance picker (named presets + a custom color editor) gives users control without forcing a redesign of the base "linux rice" look — it just becomes the default preset among many.

## What Changes

- Add a `/settings` page with a sidebar/tab layout for future settings sections.
- Add an **Appearance** section with two modes, switched by a segmented control:
  - **Preset**: a grid of named theme swatches (e.g. `linux rice` as the default, plus additional curated presets). Clicking a swatch applies it immediately.
  - **Custom**: a form of labeled color-token inputs (background, main/primary, text, sub, caret, error, etc.), each with a text field + color-swatch picker, that builds a custom theme live.
- Theme selection (preset id or custom token map) is applied at runtime via CSS custom properties on `<html>`/`<body>`, and persisted client-side (localStorage), same mechanism class as the existing light/dark toggle — no DB migration, no server round-trip to apply a theme.
- Preset catalog is a static data file (`lib/themes/presets.ts` or similar) of token maps, seeded with a small curated set (not attempting to replicate Monkeytype's full ~30+ preset list).
- **BREAKING (internal only)**: `globals.css`'s `:root`/`.dark` token values become the `linux rice` preset's light/dark values rather than the only possible values; other code that assumed those exact OKLCH values as compile-time constants (none currently does) would need to read CSS vars at runtime instead.

## Capabilities

### New Capabilities
- `theme-customization`: settings page appearance section, preset theme picker, custom theme editor, runtime theme application, and client-side persistence.

### Modified Capabilities
- `design-system`: the "Single-accent terminal color palette" requirement changes from a hardcoded, fixed `:root`/`.dark` palette to a default preset that a user can override at runtime; the design system's token *names* and zero-radius/no-gradient/monospace requirements remain unchanged.

## Impact

- `web/app/globals.css` — token values reorganized so they can be overridden at runtime (CSS variables already exist; likely moved to a JS-applied `style` map or `data-theme` attribute selectors).
- `web/providers/theme-provider.tsx` — extended or paired with a new theme-application provider that also handles preset/custom color tokens (on top of existing light/dark mode from `next-themes`).
- `web/components/user-dock.tsx` — no functional change required, but its dark/light toggle must keep working alongside the new preset/custom system.
- New route: `web/app/[locale]/settings/` (page + `_components/` for the layout, nav, and appearance section).
- New data/logic: theme preset catalog, custom-theme token schema/validation, localStorage persistence helper.
- No changes to `judge/` or the database schema.
