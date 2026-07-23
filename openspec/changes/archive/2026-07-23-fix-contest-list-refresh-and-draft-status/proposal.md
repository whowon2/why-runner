## Why

Two contest-page bugs undermine trust in the owner-facing contest management flow: deleting a contest leaves it visible in the list until a manual refresh, and editing dates on a draft contest makes it visually flip to "upcoming"/"active"/"past" even though it was never published. Both stem from the same class of issue — mutations and derived UI state not being kept in sync with the real source of truth (the `contest.status` DB column and the React Query cache).

## What Changes

- Add cache invalidation to `useDeleteContest` (`web/hooks/use-delete-contest.tsx`) so the `["contests"]` query is invalidated on successful delete, matching the pattern already applied to other contest mutations in commit `29fd83e`. Fixes the contests list still showing a deleted contest after redirect.
- Fix `getContestStatus` (`web/lib/get-contest-status.ts`) to check the real `contest.status` column first: if `status === "draft"`, always return `"draft"` regardless of dates. Only fall through to date-derived `upcoming`/`active`/`past` once `status === "published"`. Update call sites (`card.tsx`, `description.tsx`, and the countdown text in `getStatusText`) to pass `status` through.
- Confirm/harden that publishing is blocked unless `startDate` is strictly in the future (already enforced server-side in `publishContest`; verify client-side `PublishContest` validation matches and surface a clear message when start date is today or in the past).
- Add server-side `endDate > startDate` validation to `updateContest` (currently only enforced client-side by zod) as a safety net, since date edits on drafts will remain unrestricted otherwise.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `contest-lifecycle`: displayed contest status must be derived from the stored `status` field first — a draft SHALL always display/behave as `draft` regardless of its dates, never as `upcoming`/`active`/`past`, until explicitly published.
- `query-cache-invalidation`: deleting a contest must invalidate the contest list query so the list reflects the deletion immediately, following the existing pattern used by other contest mutations.

## Impact

- `web/hooks/use-delete-contest.tsx`, `web/app/[locale]/contests/_components/tabs/settings/delete-contest.tsx`
- `web/lib/get-contest-status.ts` and its call sites: `web/app/[locale]/contests/_components/card.tsx`, `web/app/[locale]/contests/_components/description.tsx`
- `web/lib/actions/contest/update-contest.ts` (add server-side date validation)
- `web/lib/actions/contest/publish-contest.ts`, `web/app/[locale]/contests/_components/tabs/settings/publish-button.tsx` (verify future-date gating, no functional change expected)
- No DB schema changes required — `contest.status` enum (`draft`/`published`) already models this correctly.
