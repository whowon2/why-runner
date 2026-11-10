## Why

Nested/detail pages (a class, a lesson, a gradebook, admin lists, surveys, similarity reports, the contest page) have no consistent way back up the hierarchy. Some have an ad-hoc text link ("← Back to class") in varying places and styles; most have nothing, so a user who opened a direct link has only the browser back button, which may leave the app.

## What Changes

- Add an optional `backHref` prop to the shared `PageHeader` (and pass-through on `ListPageHeader`). When set, the header renders a square ghost icon button (`ArrowLeft`) to the left of the icon badge, linking to an **explicit parent route** (not `router.back()`), so it works on direct links / new tabs.
- New shared `BackButton` component (`web/components/back-button.tsx`) used by `PageHeader` and by headers that don't use `PageHeader` (contest hero).
- Accessible label: `aria-label` + `title` from a new `Common.back` i18n key ("Go back" / "Voltar") in `en.json` and `br.json`.
- Replace the existing ad-hoc text back links on those pages with the header button (removes now-unused `backTo*` keys).
- `lesson-review` currently hand-rolls `<h1>`; it moves to `PageHeader` (with subtitle) per the design-system skill.
- Bump `web/package.json` minor version.

### Page audit (`web/app/[locale]/`)

**Gets the button** (route → parent href):

| Route | Header component | Parent href | Replaces existing link? |
|---|---|---|---|
| `/classes/[classSlug]` | `class-detail.tsx` (PageHeader) | `/classes` | — |
| `/classes/[classSlug]/gradebook` | `class-gradebook.tsx` (PageHeader) | `/classes/[classSlug]` | yes, "Back to class" action button |
| `/classes/[classSlug]/lessons/[lessonSlug]` | `lesson-roadmap.tsx` (PageHeader) | `/classes/[classSlug]` | — |
| `/classes/[classSlug]/lessons/[lessonSlug]/review` | `lesson-review.tsx` (raw h1 → PageHeader) | `/classes/[classSlug]/lessons/[lessonSlug]` | yes, "Back to track" link |
| `/classes/.../exercises/[exerciseSlug]/similarity` | `exercise-similarity.tsx` (PageHeader) | `/classes/[classSlug]/lessons/[lessonSlug]` | yes, "Back to lesson" link |
| `/contests/[slug]` | `contests/_components/description.tsx` (hero, standalone `BackButton`) | `/contests` | — |
| `/contests/[slug]/similarity` | `contests/_components/similarity.tsx` (PageHeader) | `/contests/[slug]?tab=manage` | yes, "Back to contest" link |
| `/problems/[slug]/edit` | `problems/[slug]/edit/page.tsx` (PageHeader) | `/problems` | — |
| `/admin/classes`, `/admin/contests`, `/admin/users` | `admin-list.tsx` (ListPageHeader) | `/admin` | yes, "Back to admin" action button |
| `/surveys/[form]/[entityId]` | `survey-page.tsx` (PageHeader) | `/surveys` | — |
| `/surveys/preview/[form]` | `survey-preview.tsx` (PageHeader) | `/surveys` | — |
| `/surveys/results` | `survey-results.tsx` (PageHeader) | `/surveys` | — |

**No button** (reason):

- `/`, `/home`, `/classes`, `/contests`, `/problems`, `/admin`, `/surveys`, `/settings`, `/user` — top-level destinations reached from the nav/user menu. (`/settings` has no subpages; its sections are an in-page nav.)
- `/user/[username]` — public profile, no parent route (no users index).
- `/problems/[slug]`, `/contests/[slug]/problems/[problemSlug]`, `/classes/.../exercises/[exerciseSlug]` — editor workspaces; `WorkspaceShell` already has a "Back" rail item with an explicit href, and no `PageHeader`.
- `/problems/new`, `/surveys/preview` — redirect-only (spinner then redirect).
- `/classes/join/[code]` — transient join flow, redirects into the class.
- `/auth/signin`, legal pages, `[...rest]` (404) — standalone, no hierarchy.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `design-system`: adds a requirement that detail/nested page headers render a shared back icon button with an explicit parent href and a localized accessible label.

## Impact

- `web/components/page-header.tsx`, `web/components/list-page-header.tsx`, new `web/components/back-button.tsx`.
- Page components listed in the audit table.
- `web/messages/en.json`, `web/messages/br.json` (`Common.back`; drop unused `backTo*` keys).
- `web/package.json` minor bump. No DB, judge, or API changes.
