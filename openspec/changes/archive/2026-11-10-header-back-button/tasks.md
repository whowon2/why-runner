## 1. Shared components

- [x] 1.1 Add `Common.back` ("Go back" / "Voltar") to `web/messages/en.json` and `web/messages/br.json`
- [x] 1.2 Create `web/components/back-button.tsx` (ghost icon `Link` button, `ArrowLeft`, localized `aria-label`/`title`)
- [x] 1.3 Add optional `backHref` to `PageHeader`, render `BackButton` before icon badge; forward `backHref` in `ListPageHeader`

## 2. Pages

- [x] 2.1 `class-detail.tsx` → `/classes`
- [x] 2.2 `class-gradebook.tsx` → `/classes/[classSlug]`, remove "Back to class" action button
- [x] 2.3 `lesson-roadmap.tsx` → `/classes/[classSlug]`
- [x] 2.4 `lesson-review.tsx`: replace raw h1 + back link with `PageHeader` (icon, subtitle keys en/br) and `backHref` → lesson
- [x] 2.5 `exercise-similarity.tsx` → lesson, remove "Back to lesson" link
- [x] 2.6 `contests/_components/description.tsx`: standalone `BackButton` → `/contests`
- [x] 2.7 `contests/_components/similarity.tsx` → `/contests/[slug]?tab=manage`, remove "Back to contest" link
- [x] 2.8 `problems/[slug]/edit/page.tsx` → `/problems`
- [x] 2.9 `admin-list.tsx` → `/admin`, remove "Back to admin" action button
- [x] 2.10 `survey-page.tsx`, `survey-preview.tsx`, `survey-results.tsx` → `/surveys`
- [x] 2.11 Remove now-unused `backTo*` message keys (grep first)

## 3. Release & verify

- [x] 3.1 Bump `web/package.json` minor version
- [x] 3.2 `bun run lint` / typecheck / tests pass in `web/`
- [x] 3.3 Browser check with `bun dev -p $DEV_PORT` as teacher and student: button present on audited pages with correct href on direct load, absent on top-level pages, labels in en and pt
