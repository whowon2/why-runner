## Why

Current UI runs shadcn/Radix defaults: Geist Sans, 0.625rem rounded corners, soft neutral OKLCH palette, decorative gradient blobs. For a competitive-programming judge platform, a terminal/ricing aesthetic (monospace type, sharp edges, high-contrast palette, minimal chrome) better signals "built for programmers" and cuts visual noise that competes with code and problem statements.

## What Changes

- Replace `--font-sans` default stack with a monospace font (JetBrains Mono / Geist Mono) as the primary UI font across the app (not just code blocks).
- Set `--radius` to `0` (or near-0) globally — sharp rectangular corners on cards, buttons, inputs, dialogs.
- Rework the OKLCH color tokens in `web/app/globals.css` toward a terminal-inspired palette (flatter backgrounds, single accent color, thinner/higher-contrast borders) for both `:root` and `.dark`.
- Remove decorative animated gradient background keyframes (`moveHorizontal`/`moveVertical`/`moveInCircle`) and any component using them, since they clash with a minimalist rice look. **BREAKING** for any component relying on those animation utility classes.
- Reduce shadow/elevation usage in `components/ui/*` (flatten cards/popovers/dialogs — borders instead of drop shadows) where it's a shared primitive, not a one-off page.
- Update shared chrome (`UserDock`, `Footer`, nav) spacing/typography to match the flatter, denser rice style.
- Standardize the page content container width across top-level pages (currently `max-w-4xl`/`max-w-5xl`/`max-w-6xl`/`max-w-7xl` inconsistently on `/`, `/user`, `/roadmap`, `/contests`, `/problems`) to one shared max-width.
- Introduce a shared "list page header" pattern (icon badge, title, subtitle, create/primary action button, search input, filter control) reused by every listing page (`/problems`, `/contests`, and any future list page), rather than each page hand-rolling its own header markup.

## Capabilities

### New Capabilities
- `design-system`: Defines the app-wide visual design tokens (typography, radius, color palette, elevation) and the rules components must follow to stay consistent with the "Linux rice" aesthetic, plus the shared page-container width and list-page header pattern.

### Modified Capabilities
(none — no other existing spec's functional requirements change; this is purely presentational)

## Impact

- `web/app/globals.css` — font token, radius token, color tokens, removal of gradient keyframes.
- `web/app/[locale]/layout.tsx` — font loading (swap Geist Sans import for a mono font).
- `web/components/ui/*` — shared primitives (card, button, dialog, popover, input, etc.) inherit new radius/border/shadow tokens automatically via CSS variables; no per-component rewrite expected unless a component hardcodes `rounded-*`/`shadow-*` outside the token system.
- Any component currently using the `animate-first/second/third/fourth/fifth` gradient-blob utilities (decorative backgrounds) needs those elements removed or restyled.
- `web/app/[locale]/page.tsx`, `web/app/[locale]/user/page.tsx`, `web/app/[locale]/roadmap/page.tsx`, `web/app/[locale]/contests/_components/list.tsx`, `web/app/[locale]/problems/_components/list.tsx` — reconciled to one shared container max-width and, for the two list pages, one shared header component.
- Purely visual/CSS-level change — no schema, server action, or judge changes.
