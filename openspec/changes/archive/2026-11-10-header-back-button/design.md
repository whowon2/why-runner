## Context

`PageHeader` is a server-safe presentational component (icon badge + title + subtitle + action). `ListPageHeader` wraps it. Several detail pages already link back with ad-hoc text links/buttons in different spots (above the header, inside `action`). The contest detail page uses a centered hero (`description.tsx`) instead of `PageHeader`. Routing uses `Link` from `@/i18n/navigation` (next-intl, locale-aware).

## Goals / Non-Goals

**Goals:** one consistent back affordance on nested pages; works on direct links; accessible, localized label.

**Non-Goals:** breadcrumbs; changing editor workspace rail back; adding back to top-level pages; converting the contest hero to `PageHeader`.

## Decisions

- **`backHref?: string` prop on `PageHeader`**, forwarded by `ListPageHeader`. Alternative: `back?: ReactNode` slot — rejected, every caller would re-implement the button.
- **Explicit parent href, not `router.back()`.** History may be empty (new tab, shared link) or point outside the app. Parent is derivable from route params already available in each component.
- **`BackButton` component** (`components/back-button.tsx`): `Button variant="ghost" size="icon" asChild` wrapping `Link`, `ArrowLeft` icon, `aria-label`/`title` = `t("Common.back")`. Uses `useTranslations`, so it's a client component; `PageHeader` stays importable from both server and client components because a server component may render a client child.
- **Placement:** inside the left cluster, before the icon badge, so it aligns with the title row on mobile and desktop.
- **Contest hero** renders `<BackButton href="/contests" />` at its top-left (`self-start`), since the hero is centered and has no `PageHeader`.
- **Remove replaced text links** and their now-unused `backTo*` message keys (only where no other usage remains, checked with grep). Error/empty-state "back" buttons (e.g. contest not found, lesson review not-yet-available state) stay — they're content, not header.
- **Problem edit parent = `/problems`**: the "Try it" action already links to `/problems/[slug]`.

## Risks / Trade-offs

- [Icon-only button less discoverable than text] → `title` tooltip + universal arrow icon; matches workspace rail.
- [Survey page parent could be the class/contest the survey belongs to] → `/surveys` hub lists all surveys; simpler and always valid.
