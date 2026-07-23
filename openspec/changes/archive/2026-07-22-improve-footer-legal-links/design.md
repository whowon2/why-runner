## Context

`web/components/footer.tsx` is a one-line placeholder. `web/components/user-dock.tsx` renders a floating dock (nav links, GitHub social icon, theme toggle, settings/avatar or login) sticky at the page bottom, in `web/app/[locale]/layout.tsx` alongside `<Footer />`. The sibling project `davar` (`$HOME/code/davar`) already solves this with a `Footer` + `LegalFooterLinks` component and six flat `(public)/<slug>/page.tsx` routes rendered through a shared `LegalPage` layout. Why Runner differs in that all routes live under `app/[locale]/` (next-intl), so link/navigation must go through `@/i18n/navigation`'s `Link`, not plain `next/link`.

## Goals / Non-Goals

**Goals:**
- Footer gains: copyright line, six legal page links, GitHub repo link (moved from dock).
- Six new routed pages with real placeholder legal copy, adapted from davar's structure but rewritten for Why Runner (competitive judge platform, not a bible-study app), translated into both `en` and `br`.
- Dock loses the GitHub icon and its now-empty-if-alone separator.
- New pages use one fixed set of English URL slugs across both locales (`/terms`, `/privacy`, `/cookies`, `/community-guidelines`, `/copyright`, `/moderation`), matching every other route in the app (`/contests`, `/problems`, `/roadmap`, `/settings` are all English regardless of locale). Only the rendered content (title, intro, body) is locale-aware — `/en/terms` and `/br/terms` share the same URL but render English vs Portuguese copy.

**Non-Goals:**
- No real legal review of the placeholder copy — it's TCC/demo content, not production legal text.
- No CMS/admin editing of legal content; pages are static React/TSX driven by message files.
- No localized URL slugs (e.g. `/br/termos`) — two approaches were tried and reverted (see Decision 7); the app has no precedent for per-locale slugs anywhere else, so legal pages stay consistent with that.

## Decisions

1. **Route group `app/[locale]/(legal)/`** — a route group (parens = no URL segment) keeps the six pages out of the top-level `app/[locale]/` listing shown in the CLAUDE.md directory map, mirroring davar's `(public)` grouping, without adding a `/legal` URL prefix.
   - Alternative considered: flat pages directly under `app/[locale]/termos/`, etc. Rejected only for organization — functionally identical; route group is purely cosmetic/organizational and free to add.
2. **Shared `LegalPage` component** at `web/components/legal-page.tsx`, ported near-verbatim from davar (`title`, `updatedAt`, `children` prose wrapper). Keeps each of the six page files to just title + body content.
3. **`LegalFooterLinks` uses `@/i18n/navigation`'s `Link`**, not `next/link` — required so links resolve under the active locale prefix, unlike davar which has no locale routing.
4. **GitHub link relocation**: delete the `Icons.github` + `DATA.contact.social` block and its `DockIcon`/`Separator` from `user-dock.tsx`; add the same inline SVG icon + link to the new footer, opening in a new tab as before (`target="_blank" rel="noreferrer"`).
5. **Footer layout**: centered, small-text, matches existing site's centered/minimal aesthetic (footer today is `border-t p-4 text-center`) — copyright line, then legal nav, then a icon row (just GitHub) — three stacked rows, consistent with davar's copyright-then-nav two-row footer plus one extra row for the relocated icon.
6. **i18n**: add `Footer.copyright`, `Footer.links.*` (six labels, translated per locale), and `Footer.githubLabel` to both `messages/en.json` and `messages/br.json`. Legal page content (title, intro, per-section heading/paragraphs/lists) lives under a `Legal.*` namespace in both message files, fully translated rather than hardcoded — each of the six pages is an async server component calling `getTranslations`/`generateMetadata` and rendering the section data through a shared `LegalContent` component (`web/components/legal-content.tsx`). Translated strings support two inline markers that `LegalContent` parses in a single regex pass: `[[label|/href]]` for cross-links between legal pages (resolved through `@/i18n/navigation`'s `Link`, which still prefixes the active locale even though the slug itself isn't localized) and `**text**` for bold emphasis (rendered as `<strong>`, restoring the emphasis the original davar-derived JSX had via `<strong>` tags before content moved into message-file strings).
7. **URL slugs are plain English, identical across `en` and `br`** (e.g. `/terms`, `/privacy`) — not localized. Two localization approaches were tried and reverted:
   - `next-intl`'s built-in `pathnames` routing option (e.g. `/en/terms` vs `/br/termos`) requires *every* route in the app to be enumerated in the `pathnames` map — once declared, `next-intl`'s typed `Link`/`usePathname`/`router.push` restrict `href` to exactly those keys, which broke typechecking across the whole app (dynamic routes like `/contests/[slug]`, `/problems/[slug]` are linked via plain template-literal hrefs that don't satisfy a typed-pathnames shape).
   - A hand-rolled per-locale slug map (`LEGAL_SLUGS` keyed by locale, separate route folders per language, `getLocale()` guards returning `notFound()` on slug/locale mismatch) worked but was reverted per explicit feedback: no other route in the app has a localized slug, so legal pages shouldn't either. Only the six page folders under `app/[locale]/(legal)/` use English names (`terms`, `privacy`, `cookies`, `community-guidelines`, `copyright`, `moderation`); `LEGAL_SLUGS` in `web/lib/legal-routes.ts` is now a flat, locale-independent map.

## Risks / Trade-offs

- [Removing GitHub icon from dock is a visible, user-facing layout change] → Flagged **BREAKING** in proposal; low risk since dock icon set is small and footer is always rendered on the same pages.
- [Route group naming collision] → Verified `app/[locale]/(legal)` doesn't already exist before creating.
- [Translated legal text drifts from source over time since it's duplicated across `en`/`br` message trees] → Acceptable for a TCC demo; no CMS or single-source-of-truth mechanism is in scope.

## Migration Plan

1. Add `LegalPage` shared component.
2. Add six page files under `app/[locale]/(legal)/`.
3. Add `Footer`/legal i18n keys to both message files.
4. Rewrite `footer.tsx` (copyright + `LegalFooterLinks` + GitHub link).
5. Strip GitHub icon/link from `user-dock.tsx`.
6. Manual smoke test: `bun dev`, visit `/`, click each footer link, confirm dock no longer shows GitHub icon.

No DB/API changes, so no rollback beyond reverting the commit.

## Open Questions

- None blocking; legal copy content is placeholder-quality by design for this TCC project, translated but not legally reviewed in either language.
