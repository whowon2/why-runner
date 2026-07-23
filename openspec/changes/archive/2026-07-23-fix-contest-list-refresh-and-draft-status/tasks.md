## 1. Fix stale contest list after delete

- [x] 1.1 Add `useQueryClient` to `web/hooks/use-delete-contest.tsx` and invalidate `["contests"]` (and `["contest", contestId]` if available) in `onSuccess`
- [x] 1.2 Verify `web/app/[locale]/contests/_components/tabs/settings/delete-contest.tsx` no longer needs its own invalidation logic (relies on the hook)
- [ ] 1.3 Manually verify: delete a draft contest from Danger Zone, confirm it's gone from `/contests` immediately after redirect, no manual refresh needed

## 2. Fix draft status changing on date edit

- [x] 2.1 Update `getContestStatus` in `web/lib/get-contest-status.ts` to accept `status` and return `"draft"` immediately when `status === "draft"`, before checking dates
- [x] 2.2 Update `getStatusText` (same file) to respect the same draft-first rule for countdown text
- [x] 2.3 Update call sites to pass `contest.status`: `web/app/[locale]/contests/_components/card.tsx`, `web/app/[locale]/contests/_components/description.tsx`
- [ ] 2.4 Manually verify: create a draft, set start/end dates (past, present-spanning, and future), confirm badge/text stays "Draft" in list and detail views in all cases
- [ ] 2.5 Manually verify: publishing still works and correctly shows upcoming/active/past after `status` becomes `published`

## 3. Harden publish/update validation

- [x] 3.1 Add server-side `endDate > startDate` check to `web/lib/actions/contest/update-contest.ts` (reuse comparison logic from `publish-contest.ts`)
- [x] 3.2 Verify `publish-contest.ts`'s existing `startDate > now` check still rejects publishing with a start date in the past or present
- [x] 3.3 Verify `PublishContest` client component (`web/app/[locale]/contests/_components/tabs/settings/publish-button.tsx`) surfaces a clear validation message when start date is not strictly in the future

## 4. Verification

- [x] 4.1 Run `web` typecheck/lint to confirm no missed `getContestStatus` call sites
- [ ] 4.2 Manual end-to-end pass covering both bugs per steps in 1.3, 2.4, 2.5
