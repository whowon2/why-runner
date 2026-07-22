## Context

Theme state today is minimal: `next-themes` (`web/providers/theme-provider.tsx`) toggles a single `dark` class on `<html>`, and `web/app/globals.css` defines exactly two fixed token sets (`:root`, `.dark`) per the `design-system` spec. There is no settings page, no per-user preference storage beyond auth, and no existing color-picker UI primitive (`components/ui/` has `tabs.tsx` but nothing for color input).

`RootLayout` (`app/[locale]/layout.tsx`) wraps everything in `Providers` → `NextIntlClientProvider` → `NuqsAdapter`. Any new theme provider slots in alongside `ThemeProvider` inside `providers/index.tsx`.

## Goals / Non-Goals

**Goals:**
- Ship a `/settings` page with an Appearance section usable today: preset picker + custom editor, both applying instantly with no page reload.
- Keep `next-themes`' light/dark toggle (`user-dock.tsx`) working unmodified — it controls the `dark` class; the new system controls color *values* within whichever mode is active.
- Persist the chosen preset id (or custom token map) client-side only, surviving reloads and new tabs on the same browser.
- Keep `linux rice` (the current `design-system` palette) as the default preset for both light and dark, so existing users see no change until they opt in.

**Non-Goals:**
- No per-user server-side persistence (no DB migration, no cross-device sync) — theme choice is a local preference, same tier as the existing dark/light toggle.
- No attempt to match Monkeytype's full preset catalog size — ship a small curated set (5-10 presets), extensible later.
- No theme marketplace / sharing / import-export ("share" button from the reference screenshot is out of scope for v1).
- No changes to `judge/` or shared DB schema.

## Decisions

**Token model: reuse existing CSS custom property names, both light and dark variants per preset.**
Each preset is a TS object with `light` and `dark` keys, each mapping the *same* variable names already declared in `globals.css`'s `@theme inline` block (`--background`, `--foreground`, `--primary`, etc.) — not the Monkeytype-specific names (`sub`, `caret`, `main`) shown in the reference UI. Rationale: keeps one token vocabulary across the whole app; the custom editor's field labels can still say "background / main / text / sub / caret / error" as friendly aliases mapped onto the underlying `--background`/`--primary`/`--foreground`/`--muted`/`--ring`/`--destructive` variables. Alternative considered: adopt Monkeytype's exact token set — rejected, it would fork the design system's variable names and require touching every component that consumes `--color-*` Tailwind tokens.

**Application mechanism: inline `style` attribute on `<html>` (CSS variable overrides), not a `data-theme` class list.**
A client-side `ThemeTokensProvider` reads the active preset/custom map from `localStorage` on mount and sets `document.documentElement.style.setProperty(varName, value)` for each token, both in an effect and via a tiny inline blocking script (like `next-themes` already injects) to avoid flash-of-default-theme on load. Alternative considered: one `data-theme="<preset>"` attribute + a CSS class per preset — rejected because it can't represent arbitrary custom colors, only enumerable presets; inline vars handle both presets and custom uniformly.

**Storage: single localStorage key, JSON-encoded.**
`why-runner:theme` stores `{ mode: "preset" | "custom", presetId?: string, custom?: Record<TokenKey, { light: string; dark: string }> }`. Rationale: mirrors `next-themes`' own localStorage-based approach already in use for dark/light — no new persistence layer, no auth dependency, works for logged-out users too. Alternative considered: store in the `user` Drizzle table — rejected for v1 per Non-Goals (adds a migration + server action + hydration-on-login complexity for a preference that's arguably per-device anyway).

**Settings page structure: server component shell + client tabs, following the existing `/user` page pattern.**
`app/[locale]/settings/page.tsx` (server component, auth-gated via `getCurrentUser()`) renders a layout with a left-hand section nav (Account, Appearance, ...) and `_components/appearance-section.tsx` (client component) for the preset/custom UI, matching how `app/[locale]/user/_components/tabs.tsx` splits server/client concerns today.

**Custom editor inputs: plain text `Input` + native `<input type="color">` swatch, no new dependency.**
No color-picker library is added; `components/ui/input.tsx` handles the hex text field and a native `<input type="color">` (styled as a small swatch button) handles the visual picker, consistent with the "no new dependency unless required" bias in `CLAUDE.md` conventions.

## Risks / Trade-offs

- [Risk] Inline style overrides on `<html>` could be wiped by a hard navigation before hydration, causing a flash of the default preset → Mitigation: inline blocking `<script>` in `<head>` (same pattern `next-themes` uses) reads localStorage and applies vars before paint.
- [Risk] Custom colors chosen by a user could produce poor contrast (e.g. unreadable text) → Mitigation: v1 ships no contrast validation (matches Monkeytype's own behavior); documented as a known limitation, not blocking.
- [Risk] Divergence between `design-system` spec (which currently mandates one fixed palette) and this change → Mitigation: `design-system` spec gets a delta in this change narrowing its color requirement to "default preset," not "the only palette."
- [Trade-off] Client-only persistence means theme doesn't follow the user across devices/browsers → acceptable per Goals; can be revisited as a follow-up change adding server-side sync once there's user demand.

## Migration Plan

1. Add preset catalog + token schema (no runtime behavior change yet).
2. Add `ThemeTokensProvider` + blocking init script, defaulting everyone to the `linux rice` preset (visually identical to current `globals.css` values) — safe to ship independently.
3. Add `/settings` route and Appearance section UI, wired to the provider.
4. No DB migration, no data backfill. Rollback is a plain revert (delete the route + provider); no persisted server state to unwind.

## Open Questions

- Should the settings page's nav include placeholder sections (Account, Notifications, etc.) now, or ship Appearance as the only section until other settings exist? (Leaning: ship only Appearance now, structure the layout so more sections drop in later.)
