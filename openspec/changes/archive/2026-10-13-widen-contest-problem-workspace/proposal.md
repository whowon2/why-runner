## Why

On a contest page's Problems tab, the statement + code editor split is squeezed into a narrow centered column (`max-w-6xl`, plus stacked `p-4` wrappers and card padding), leaving large empty gutters on wide screens. The editor's height is also driven by however tall the statement happens to be, so short problems give a short editor. Contestants spend the whole contest in this view; it should use the screen.

## What Changes

- The Problems tab content (problem letter selector, statement/submissions panel, code editor panel) expands to use nearly the full viewport width on large screens instead of the shared `max-w-6xl` cap. Header/description card and other tabs (Leaderboard, Settings, Manage) keep their current width.
- The statement/editor split gets a viewport-based height (fills the remaining screen height, with a sensible minimum), so the editor is tall regardless of statement length, and the statement panel scrolls independently when long.
- Redundant nested padding around the Problems tab (page `p-4` + tabs wrapper `p-4` + card padding + panel padding) is trimmed.
- Resizable panels get explicit default/min sizes (e.g. ~45/55 statement/editor) so neither side collapses too far.
- On narrow screens (< `lg`), the split stacks vertically (statement on top, editor below) instead of forcing a cramped horizontal split.

## Capabilities

### New Capabilities
- `contest-problem-layout`: Layout requirements for the contest Problems tab workspace — width, height, panel sizing, and responsive stacking of the statement and code editor.

### Modified Capabilities
<!-- none: no existing spec defines contest problem-tab layout -->

## Impact

- `web/app/[locale]/contests/_components/tabs/index.tsx` — per-tab width (Problems wide, others unchanged).
- `web/app/[locale]/contests/_components/tabs/problem/index.tsx` — panel group height, default/min sizes, responsive direction, padding.
- `web/app/[locale]/contests/_components/tabs/problem/upload.tsx` — editor card sizing (`max-h-screen`, padding) so it fills its panel.
- Possibly `web/app/[locale]/contests/[slug]/page.tsx` — outer padding.
- No backend, schema, API, or i18n changes.
