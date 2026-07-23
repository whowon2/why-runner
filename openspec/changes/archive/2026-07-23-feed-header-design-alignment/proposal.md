## Why

The `/feed` page header was built with bespoke JSX (`FeedTabs`) instead of the shared `PageHeader`/`ListPageHeader` pattern the design system mandates for list-style pages. It uses a smaller icon (no badge box), a smaller title (`text-xl` vs `text-2xl`), no subtitle, and different top spacing than `/problems` and `/contests` — so it visibly doesn't match the rest of the app.

## What Changes

- Replace the inline icon/title markup in `web/app/[locale]/feed/_components/feed-tabs.tsx` with the shared `PageHeader` component (icon badge, `text-2xl` title, subtitle).
- Add a `subtitle` translation key for the feed page (`SocialFeed.subtitle`) in `en.json`/`br.json`, matching how `/problems` and `/contests` supply a subtitle.
- Align the `/feed` page container structure (`web/app/[locale]/feed/page.tsx`) with the `/problems`/`/contests` pattern so top spacing matches.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `social-feed`: feed page header now follows the shared design-system header pattern instead of custom markup.

## Impact

- `web/app/[locale]/feed/page.tsx`
- `web/app/[locale]/feed/_components/feed-tabs.tsx`
- `web/messages/en.json`, `web/messages/br.json`
