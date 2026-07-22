## Context

`web/app/[locale]/not-found.tsx` is a server component rendered via next-intl (`getTranslations("NotFound")`). App theme uses Tailwind v4 `@theme` tokens in `web/app/globals.css` (oklch light/dark palette, `--font-sans` via `--font-geist-sans`, no `--font-mono` token declared today — falls back to Tailwind's default `font-mono` stack, which is fine, no new font asset needed). Existing empty-state pattern (`web/app/[locale]/user/_components/my-problems.tsx`) establishes the app's visual language for "nothing here": dashed-border `Card` (`border-dashed border-2 bg-muted/20`), a rounded icon badge in an accent color, `CardTitle`/`CardDescription`, and a gradient-glow CTA button.

## Goals / Non-Goals

**Goals:**
- Replace the generic 404 with a judge/runner-themed presentation that reads as a mock verdict or terminal error for the missing route.
- Reuse existing UI primitives (`Card`, `Button`, `lucide-react` icons) and the established empty-state visual pattern — no new UI library.
- Keep it a server component (no client JS needed for a static themed page); preserve next-intl wiring.
- Support both locales (en/br) via existing `messages/*.json` structure.

**Non-Goals:**
- Not touching `error.tsx` or `global-error.tsx` (real runtime error boundaries — different concern, different tone: those should stay serious/functional, not jokey).
- No new animation library or canvas/confetti-style effects — stay within existing Tailwind + CSS.
- No change to routing/middleware behavior that produces 404s.

## Decisions

- **Verdict-chip + mock terminal panel over pure ASCII art**: Render a small badge styled like a judge verdict (e.g. `404` in a chip resembling `WA`/`RE` result colors — red/orange accent) next to a monospace block showing 2-3 lines that look like judge output, e.g.:
  ```
  $ curl /this/route
  Status: 404
  RuntimeError: page.tsx returned None
  ```
  Rationale: matches the "script returned null" / "wrong code" idea from the request while staying legible and on-brand (verdict chips already exist elsewhere in a judge UI, e.g. submission results), rather than a full ASCII-art illustration which would be higher effort and harder to localize.
- **Reuse `my-problems.tsx` empty-state card shell** (dashed border, icon badge, gradient CTA) rather than inventing a new layout: keeps visual consistency across "empty state" surfaces in the app, and copy/paste-adapt is far lower risk than a bespoke full-page design.
- **Icon choice**: `Bug` or `TerminalSquare` from `lucide-react` (already a dependency) in the icon badge, colored red/orange (`text-red-500`/`bg-red-500/10`) to read as an error state, distinct from the indigo used for the "no problems yet" empty state.
- **Monospace styling via Tailwind's default `font-mono` utility** — no new `--font-mono` CSS variable needed unless visual review shows the fallback stack looks off; if so, add `--font-mono: var(--font-geist-mono)` to `globals.css` `@theme` block (Geist mono ships alongside Geist sans in `next/font/google`/local setup already used for `--font-geist-sans`).
- **i18n**: extend the existing `"NotFound"` namespace in `messages/en.json`/`messages/br.json` with new keys (`verdict`, `logLine1`, `logLine2`, etc.) rather than introducing a new namespace, since this is still "the not-found page's copy."

## Risks / Trade-offs

- [Risk] Overly jokey copy could read as unprofessional in a thesis-defense-adjacent product. → Mitigation: keep tone dry/technical (real-looking log lines) rather than punchline-heavy; get a quick visual check before finalizing copy.
- [Risk] Monospace "log" text needs enough contrast/readability in both light and dark themes given oklch tokens. → Mitigation: use existing `muted-foreground`/`foreground` tokens plus a small accent color for the status line, verify in both themes during implementation.
- [Risk] Reusing the empty-state shell too literally may make 404 look like "no problems yet" card. → Mitigation: differentiate via icon, accent color (red/orange vs indigo), and the terminal/log block as the distinguishing element.

## Migration Plan

Single-file (plus i18n json + optional CSS token) change, no data migration. Deploy as normal frontend change. Rollback = revert the commit; no backend/schema coupling.

## Open Questions

- Exact copy/joke for the log lines (e.g. "Segmentation fault (core dumped)" vs "RuntimeError: page returned None") — left as an implementation-time creative decision, informed by the design direction above.
