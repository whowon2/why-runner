## Why

The site footer is currently a single unlinked line ("Why Runner") with no legal or policy pages, and the GitHub repo link lives inside the floating user dock alongside navigation/auth controls, where it doesn't belong. Before public/contest use, the platform needs standard legal pages (terms, privacy, cookies, community guidelines, copyright, moderation) linked from a proper footer, matching the pattern used in the `davar` sibling project.

## What Changes

- Add six new legal pages under `app/[locale]/(legal)/` at fixed English URL slugs shared across every locale (`/terms`, `/privacy`, `/cookies`, `/community-guidelines`, `/copyright`, `/moderation`) — content translated per locale, slug is not, matching every other route in the app. Each page renders through a shared `LegalPage` layout component (title + "last updated" + prose content).
- Rebuild `components/footer.tsx` into a real footer: copyright line + a `LegalFooterLinks` nav linking to the six new pages, plus the GitHub repo icon/link moved here from the dock.
- **BREAKING**: Remove the GitHub social icon/link from `UserDock` (`components/user-dock.tsx`) — it moves to the footer and is no longer part of the dock's icon set.
- Add new i18n message keys (`Footer`, `Legal.*`) to `messages/en.json` and `messages/br.json` — footer link labels and full legal page content (title, intro, sections) translated into both English and Portuguese, same as the rest of the app.

## Capabilities

### New Capabilities
- `legal-pages`: Static, locale-aware legal/policy pages (terms, privacy, cookies, community guidelines, copyright, moderation) reachable via routed URLs.
- `site-footer`: The global footer's structure and content — copyright, legal navigation links, and the relocated GitHub repo link.

### Modified Capabilities
- (none — no existing spec covers the dock or footer today)

## Impact

- `web/components/footer.tsx` — rewritten
- `web/components/user-dock.tsx` — GitHub icon/link removed
- `web/app/[locale]/layout.tsx` — no structural change (Footer/UserDock already both rendered; order stays)
- `web/app/[locale]/(legal)/*` — six new English-slug page routes + shared layout, each rendering translated content per locale
- `web/lib/legal-routes.ts` — new `LEGAL_SLUGS` map (canonical key → fixed English slug)
- `web/messages/en.json`, `web/messages/br.json` — new `Footer`/`Legal` message namespaces, fully translated
- No database, API, or server-action changes.
