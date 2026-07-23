## 1. Link attached problems in Settings

- [x] 1.1 In `web/app/[locale]/contests/_components/tabs/settings/problems.tsx`, wrap the code+title span for each attached problem row in a `Link` (from `@/i18n/navigation`) to `/problems/${probOnCont.problem.slug}`
- [x] 1.2 Style the link to read clearly against the row (e.g. hover underline) without disrupting the reorder/remove button click targets

## 2. Verify

- [x] 2.1 `bun lint` in `web/`
- [ ] 2.2 Manually verify: open a contest's Settings tab as its creator, click an attached problem's code/title, confirm navigation to `/problems/[slug]`
