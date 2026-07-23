## 1. i18n

- [x] 1.1 Add `SocialFeed.subtitle` key to `web/messages/en.json` and `web/messages/br.json`

## 2. Header

- [x] 2.1 In `web/app/[locale]/feed/_components/feed-tabs.tsx`, replace the inline icon/`<h1>` block with `PageHeader` from `@/components/page-header`, passing the `Newspaper` icon, `t("title")`, and `t("subtitle")`
- [x] 2.2 Remove the now-unused inline icon/title markup and `Newspaper` styling from `feed-tabs.tsx`

## 3. Container spacing

- [x] 3.1 Update `web/app/[locale]/feed/page.tsx` wrapper to `flex w-full flex-1 flex-col items-center gap-4 p-4`, matching `problems/page.tsx`/`contests/page.tsx`
- [x] 3.2 Wrap the header + tabs content in `feed-tabs.tsx` with `w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8`, matching the `/problems`/`/contests` list-component wrapper

## 4. Verification

- [x] 4.1 Run `bun lint` in `web/`
- [ ] 4.2 Visually compare `/feed` header against `/problems` and `/contests` headers in the running app (icon badge, title size, subtitle, top spacing)
