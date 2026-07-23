## 1. i18n message keys

- [x] 1.1 Add `Footer` namespace (copyright, six legal link labels, githubLabel) to `web/messages/en.json`
- [x] 1.2 Add matching `Footer` namespace to `web/messages/br.json`

## 2. Shared legal page layout

- [x] 2.1 Create `web/components/legal-page.tsx` (`LegalPage` component: title, updatedAt, prose children), adapted from `$HOME/code/davar/src/components/layout/LegalPage.tsx`

## 3. Legal page routes

- [x] 3.1 Create route group `web/app/[locale]/(legal)/`
- [x] 3.2 Add `(legal)/termos/page.tsx` — Termos de Uso, content adapted from davar's `termos/page.tsx` for a competitive-judge platform context
- [x] 3.3 Add `(legal)/privacidade/page.tsx` — Privacidade
- [x] 3.4 Add `(legal)/cookies/page.tsx` — Cookies
- [x] 3.5 Add `(legal)/diretrizes/page.tsx` — Diretrizes da Comunidade
- [x] 3.6 Add `(legal)/direitos-autorais/page.tsx` — Direitos Autorais
- [x] 3.7 Add `(legal)/moderacao/page.tsx` — Moderação

## 4. Footer rebuild

- [x] 4.1 Create `web/components/legal-footer-links.tsx` — nav of six links using `@/i18n/navigation`'s `Link` + `Footer.links.*` messages
- [x] 4.2 Rewrite `web/components/footer.tsx`: copyright line (`Footer.copyright`), `LegalFooterLinks`, and relocated GitHub icon/link (opens `https://github.com/whowon2/why-runner` in new tab)

## 5. Dock cleanup

- [x] 5.1 Remove `Icons.github`, `DATA.contact.social`, and the associated `DockIcon`/`Separator` block from `web/components/user-dock.tsx`

## 6. Verification

- [x] 6.1 Run `bun lint` in `web/`
- [x] 6.2 `bun dev`, manually visit `/`, confirm dock has no GitHub icon and footer shows copyright + 6 legal links + GitHub icon
- [x] 6.3 Click each of the 6 footer legal links and confirm each route renders without error
- [x] 6.4 Confirm GitHub footer link opens `https://github.com/whowon2/why-runner` in a new tab

## 7. Full i18n for legal content (follow-up, requested mid-apply)

- [x] 7.1 Add `Legal` message namespace (title, intro, sections) for all six pages to `web/messages/en.json` (English translation) and `web/messages/br.json` (Portuguese, matching original copy)
- [x] 7.2 Fix `Footer.links.*` in `web/messages/en.json` — was Portuguese-only in both locale files, now translated to English
- [x] 7.3 Create `web/components/legal-content.tsx` — renders `intro` + `sections` from translation data, with `[[label|href]]` inline-link syntax resolved via `@/i18n/navigation`'s `Link`
- [x] 7.4 Rewrite all six `(legal)/*/page.tsx` to pull content via `getTranslations`/`generateMetadata` instead of hardcoded PT-only JSX
- [x] 7.5 Investigated localizing URL slugs via next-intl `pathnames` (e.g. `/en/terms`) — reverted: it requires every app route to be enumerated in the routing config, which broke typed `href`s app-wide for unrelated routes. Superseded by group 8 below (hand-rolled slug map instead) after user feedback that slugs should be localized too.

## 8. Localized URL slugs (follow-up, requested after group 7)

- [x] 8.1 Create `web/lib/legal-routes.ts` — `LEGAL_SLUGS` map of canonical key → `{ en, br }` slug pairs
- [x] 8.2 Add five new English-slug route files: `(legal)/terms/`, `(legal)/privacy/`, `(legal)/community-guidelines/`, `(legal)/copyright/`, `(legal)/moderation/` (each `page.tsx` mirrors its PT counterpart, pulling the same `Legal.*` translation keys); `cookies` slug is shared across both locales, no new route needed
- [x] 8.3 Guard each of the eleven per-locale legal pages with `if ((await getLocale()) !== "<locale>") notFound();` so e.g. `/en/direitos-autorais` and `/br/copyright` 404 instead of serving mismatched content
- [x] 8.4 Update `web/components/legal-footer-links.tsx` to resolve each link's href from `LEGAL_SLUGS` keyed by the current locale (`useLocale()`) instead of a fixed PT-only href
- [x] 8.5 Update inline `[[label|href]]` cross-link targets in `web/messages/en.json` to the English slugs (`/terms`, `/privacy`, `/community-guidelines`, `/copyright`, `/moderation`); `br.json` targets were already correct PT slugs
- [x] 8.6 Verify: `tsc --noEmit` and `bun lint` clean; curl-smoke-test all 6 `en` slugs and all 6 `br` slugs return 200, and the swapped-locale slugs (`/en/direitos-autorais`, `/br/copyright`) return 404; confirm footer and in-page links emit locale-correct hrefs on both `/en` and `/br`
- [x] 8.7 **Superseded by group 9** — explicit feedback: rest of the app's URLs are English-only, legal pages shouldn't be the exception; localized slugs (this whole group) reverted in favor of one shared English slug set

## 9. English-only URL slugs (follow-up, requested after group 8)

- [x] 9.1 Delete the five PT-slug route folders (`(legal)/termos/`, `(legal)/privacidade/`, `(legal)/diretrizes/`, `(legal)/direitos-autorais/`, `(legal)/moderacao/`) — `cookies` already matched in both languages, kept as-is
- [x] 9.2 Remove the `getLocale()`/`notFound()` locale guard from the six remaining `(legal)/*/page.tsx` files (`terms`, `privacy`, `cookies`, `community-guidelines`, `copyright`, `moderation`) — no longer needed since each slug now serves both locales
- [x] 9.3 Simplify `web/lib/legal-routes.ts`: `LEGAL_SLUGS` is now a flat `key -> href` map (no per-locale branching)
- [x] 9.4 Simplify `web/components/legal-footer-links.tsx` to read the flat map directly, no `useLocale()`
- [x] 9.5 Update inline `[[label|href]]` targets in `web/messages/br.json` from PT slugs to the shared English slugs (`en.json` was already correct)
- [x] 9.6 Verify: `tsc --noEmit` and `bun lint` clean; curl-smoke-test all 6 slugs under both `/en/*` and `/br/*` return 200 (12 total), old PT-only slugs (`/en/termos`, `/br/termos`, `/en/direitos-autorais`) now 404; confirm content is still translated per locale at the shared slug (`/br/terms` renders Portuguese, `/en/terms` renders English)

## 10. Restore lost bold formatting (follow-up, requested after group 9)

- [x] 10.1 Noticed the original davar-derived pages used `<strong>` tags for list-item labels (e.g. "Dados de conta:", "Cookies de preferência:") — lost when content moved into plain-string `Legal.*` message JSON in group 7
- [x] 10.2 Extend `web/components/legal-content.tsx`'s inline-parsing regex to also match `**bold**` markdown and render it as `<strong>`, alongside the existing `[[label|href]]` link marker, in one pass
- [x] 10.3 Add `**bold**` markers back to the affected list items in both `web/messages/en.json` and `web/messages/br.json` (Privacy's "data we collect" list, Cookies' "cookies we use" list)
- [x] 10.4 Verify: `tsc --noEmit`/`bun lint` clean; curl-smoke-test confirms `<strong>Account data:</strong>` / `<strong>Dados de conta:</strong>` render on `/en/privacy` and `/br/privacy`
