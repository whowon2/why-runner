## Why

Several `web/components/ui/` shadcn primitives are already installed and used in some places, but the codebase has parallel hand-rolled implementations of the same patterns elsewhere (loading spinners, empty states, pagination controls, dividers). This produces visual and behavioral drift between screens and makes future fixes (accessibility, styling, i18n) need to be applied in many places instead of one.

## What Changes

- Replace manual `<Loader className="animate-spin">` ternaries in action buttons with the existing `LoadingSwap`/`ActionButton` primitives, and replace the problems list's manual loading spinner with `Skeleton` rows.
- Replace hand-rolled "no results"/empty-state markup (icon + title + description divs) with the existing `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription` primitives, matching how `feed.tsx`, `my-problems.tsx`, and `my-contests.tsx` already use them.
- Consolidate the four duplicated prev/next pagination blocks (contests list, problems list, my-contests, my-problems) into one shared pagination UI built on shadcn's `Pagination` primitive (added via shadcn CLI, not yet installed).
- Replace plain `border-t` section dividers with the existing `Separator` primitive in the identified files.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `design-system`: adds a requirement that shared UI patterns (loading state, empty state, pagination, dividers) SHALL be expressed via the shared `components/ui/` primitive rather than page-local markup, once a primitive for that pattern exists.

## Impact

- `web/app/[locale]/problems/_components/create-button.tsx`
- `web/app/[locale]/problems/_components/publish-button.tsx`
- `web/app/[locale]/problems/_components/list.tsx`
- `web/app/[locale]/problems/_components/workspace/results.tsx`
- `web/app/[locale]/problems/_components/workspace/tests.tsx`
- `web/app/[locale]/contests/_components/create/button.tsx`
- `web/app/[locale]/contests/_components/list.tsx`
- `web/app/[locale]/contests/_components/card.tsx`
- `web/app/[locale]/contests/_components/tabs/index.tsx`
- `web/app/[locale]/contests/_components/tabs/settings/delete-contest.tsx`
- `web/app/[locale]/contests/_components/tabs/settings/publish-button.tsx`
- `web/app/[locale]/contests/_components/tabs/settings/index.tsx`
- `web/app/[locale]/user/_components/my-contests.tsx`
- `web/app/[locale]/user/_components/my-problems.tsx`
- `web/app/[locale]/user/_components/profile.tsx`
- `web/components/footer.tsx`
- `web/components/activity-card.tsx`
- new: `web/components/ui/pagination.tsx` (shadcn CLI add)
- possible new: shared local pagination wrapper component if page-specific props warrant it
