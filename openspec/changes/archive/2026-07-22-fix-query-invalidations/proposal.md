## Why

Several React Query mutations in `web/` write data but don't invalidate every query that renders it, so the UI shows stale state until an unrelated remount or manual refresh happens to evict the cache. Two concrete cases reported by the user: following/unfollowing a user doesn't refresh the followers/following list tabs, and adding a problem to a contest doesn't refresh the contest problems list in some flows. An audit of all `web/` mutation sites found several more instances of the same pattern.

## What Changes

- `hooks/use-follow.tsx` (`useToggleFollow`): also invalidate the `["follow-list"]` query key space (used by `hooks/use-follow-list.tsx` / followers & following pages), not just `["follow-state", ...]` and `["feed"]`.
- `hooks/use-add-problem.tsx` / `hooks/use-remove-problem.tsx`: move `invalidateQueries(["contest", contestId])` into the hooks' own `onSuccess` (using the mutation variables) instead of relying on the single caller (`.../tabs/settings/problems.tsx`) to do it, so future callers can't reintroduce the bug.
- `app/[locale]/contests/_components/tabs/management/pending-joins.tsx` (approve/reject mutations): also invalidate `["participants", contestId]` and `["user-contest-status", contestId]` so the Participants list and status badge reflect the approval/rejection immediately.
- `app/[locale]/contests/_components/tabs/problem/upload.tsx` (`useCreateSubmission`): also invalidate `["submissions", { contestId }]` (the key used by `hooks/use-contest-submissions.tsx`) in addition to the existing `["submissions", String(problemId)]`, so a contest admin's live submissions/management tab updates when a submission is uploaded.
- `app/[locale]/user/_components/form.tsx` (`useUpdateProfile`): invalidate `["profile", userId]` on success so the profile header reflects an updated username without a hard reload.
- `hooks/use-create-contest.tsx` / `app/[locale]/contests/_components/create/button.tsx`: invalidate `["contests"]` (prefix) in the hook's `onSuccess` instead of leaning on ad-hoc `refetchAction` props passed by only some callers, so `my-contests.tsx`'s "My Contests" list updates immediately after creating a contest.
- `app/[locale]/contests/_components/join-and-leave.tsx`: also invalidate `["user-contest-status", contestId]` on join/leave so the status badge doesn't wait out its 10s poll interval.

## Capabilities

### New Capabilities
- `query-cache-invalidation`: defines which mutations must invalidate which queries so dependent views reflect the mutation immediately, covering follow/unfollow, contest problem add/remove, contest join approval, submission upload, profile update, and contest creation.

### Modified Capabilities
(none — no `openspec/specs/` capability currently specifies cache-freshness behavior; this change fixes implementation bugs against the existing, unstated expectation that mutated data is reflected immediately in dependent views)

## Impact

- Affected files: `web/hooks/use-follow.tsx`, `web/hooks/use-add-problem.tsx`, `web/hooks/use-remove-problem.tsx`, `web/app/[locale]/contests/_components/tabs/settings/problems.tsx`, `web/app/[locale]/contests/_components/tabs/management/pending-joins.tsx`, `web/app/[locale]/contests/_components/tabs/problem/upload.tsx`, `web/app/[locale]/user/_components/form.tsx`, `web/hooks/use-create-contest.tsx`, `web/app/[locale]/contests/_components/create/button.tsx`, `web/app/[locale]/user/_components/my-contests.tsx`, `web/app/[locale]/contests/_components/join-and-leave.tsx`.
- No API, schema, or dependency changes — pure client-side React Query cache-invalidation fixes.
- No breaking changes.
