## 1. Follow/unfollow

- [x] 1.1 In `web/hooks/use-follow.tsx`, add `queryClient.invalidateQueries({ queryKey: ["follow-list"] })` to `useToggleFollow`'s `onSettled` alongside the existing `follow-state`/`feed` invalidations.
- [ ] 1.2 Manually verify: follow a user, open their followers/following tab (and your own), confirm the list updates without a manual refresh.

## 2. Contest problem add/remove

- [x] 2.1 In `web/hooks/use-add-problem.tsx`, add `onSuccess` invalidating `["contest", String(variables.contestId)]` (match the exact key shape used by `useContest`).
- [x] 2.2 In `web/hooks/use-remove-problem.tsx`, add the same `onSuccess` invalidation.
- [x] 2.3 Remove the now-redundant manual `invalidateQueries(["contest", ...])` calls in `web/app/[locale]/contests/_components/tabs/settings/problems.tsx` (`handleProblemSelect` and `handleRemoveProblem`).
- [ ] 2.4 Manually verify: add and remove a problem from a contest, confirm the problems list updates immediately.

## 3. Pending contest joins

- [x] 3.1 In `web/app/[locale]/contests/_components/tabs/management/pending-joins.tsx`, extend the approve mutation's invalidation to also cover `["participants", contestId]` and `["user-contest-status", contestId]`.
- [x] 3.2 Extend the reject mutation's invalidation the same way.
- [ ] 3.3 Manually verify: approve a pending join, confirm it disappears from pending and appears in participants; reject one, confirm it disappears from pending.

## 4. Submission upload

- [x] 4.1 In `web/app/[locale]/contests/_components/tabs/problem/upload.tsx`, add `queryClient.invalidateQueries({ queryKey: ["submissions", { contestId }] })` alongside the existing `["submissions", String(problem.id)]` invalidation after a successful upload.
- [ ] 4.2 Manually verify: upload a submission while viewing the contest's management/submissions tab as admin (in another session/tab), confirm it appears without refresh.

## 5. Profile update

- [x] 5.1 In `web/app/[locale]/user/_components/form.tsx`, add `onSuccess` invalidation of `["profile", userId]` to the `useUpdateProfile` call.
- [ ] 5.2 Manually verify: update username, confirm profile header updates without navigation/reload.

## 6. Contest creation

- [x] 6.1 In `web/hooks/use-create-contest.tsx`, add `onSuccess` invalidating the `["contests"]` prefix.
- [x] 6.2 Remove the manual `refetchAction` plumbing for contest creation in `web/app/[locale]/contests/_components/list.tsx` and `web/app/[locale]/contests/_components/create/button.tsx` now that invalidation happens in the hook (keep `refetchAction` prop only if still used for other purposes — verify before removing).
- [ ] 6.3 Manually verify: create a contest from `web/app/[locale]/user/_components/my-contests.tsx` ("My Contests"), confirm it appears without a manual refresh.

## 7. Contest join/leave status

- [x] 7.1 In `web/app/[locale]/contests/_components/join-and-leave.tsx`, add `["user-contest-status", contestId]` to the join and leave mutations' invalidation.
- [ ] 7.2 Manually verify: join and leave a contest, confirm the status badge updates immediately rather than after the 10s poll.

## 8. Verification

- [x] 8.1 Run `web/`'s lint/typecheck to confirm no regressions from the hook signature changes (e.g. `useAddProblemToContest`/`useRemoveProblemToContest` `onSuccess` now referencing mutation variables).
- [ ] 8.2 Re-run through all scenarios in `specs/query-cache-invalidation/spec.md` end-to-end.
