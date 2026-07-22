## Why

Current 404 page (`web/app/[locale]/not-found.tsx`) is a generic empty state — big "404", muted title, "go home" button — no connection to WhyRunner's competitive-programming identity. Every other empty state in the app (e.g. `my-problems.tsx`) uses a themed card with icon badge and CTA. The 404 page should carry the same judge-flavored personality: reads like a judge verdict for a missing route (e.g. "Runtime Error: route returned null", a `Segmentation fault`-style joke, or a mock verdict badge like `RE` / `404: Not Found` styled like a judge result), reinforcing the product's theme instead of feeling like framework boilerplate.

## What Changes

- Redesign `web/app/[locale]/not-found.tsx` to look like a judge/runner output: a mock terminal or verdict-card panel showing something like a runtime error, a stack trace snippet, or a "Wrong Answer / Not Found" verdict chip, with monospace styling for the "error" portion.
- Reuse existing empty-state visual language (dashed-border `Card`, icon badge, gradient CTA button) from `web/app/[locale]/user/_components/my-problems.tsx` so it's visually consistent with the rest of the app rather than a one-off design.
- Add a monospace font token (`--font-mono`) to `web/app/globals.css` `@theme` block if not already resolvable via Tailwind's default `font-mono` stack, to render the "error/log" text in the page.
- Update `web/messages/en.json` and `web/messages/br.json` under the existing `"NotFound"` key with new copy needed for the themed strings (verdict label, error message, log lines), preserving the existing `title`/`description`/`goHome` keys if still referenced elsewhere, or replacing them with new keys.
- No change to `web/app/global-error.tsx` or `web/app/[locale]/error.tsx` (different failure class — actual runtime errors — out of scope for this change).

## Capabilities

### New Capabilities
- `not-found-page`: Themed 404 page presentation — the visual/content design of the route-not-found experience, expressed as a judge-verdict/terminal-error motif consistent with the app's competitive-programming theme.

### Modified Capabilities
(none — no existing spec covers 404 page behavior)

## Impact

- Affected files: `web/app/[locale]/not-found.tsx`, `web/app/globals.css`, `web/messages/en.json`, `web/messages/br.json`.
- No backend/API/schema impact. No breaking changes — same route (`not-found.tsx` boundary), same i18n mechanism (`next-intl` `getTranslations`).
- Visual-only change; no new dependencies expected (reuses `lucide-react`, existing `Card`/`Button` UI components already in the codebase).
