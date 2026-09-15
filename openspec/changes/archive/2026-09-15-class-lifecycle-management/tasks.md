## 1. Server actions

- [x] 1.1 `web/lib/actions/classes/delete-class.ts`: `deleteClass(classroomId: string)` — load classroom by id, throw "Class not found" if missing, throw "Forbidden" if `createdBy !== currentUser.id`, then `db.delete(classroom).where(eq(classroom.id, classroomId))`. Mirror `delete-contest.ts` structure exactly (no start-date-style guard needed, per design.md).
- [x] 1.2 `web/lib/actions/classes/remove-member.ts`: `removeMember(classroomId: string, userId: string)` — use `assertClassOwner(classroomId, currentUser.id)`, reject if `userId === currentUser.id` (owner can't remove self), then delete the matching `classroomMembership` row (`and(eq(classroomId), eq(userId))`).
- [x] 1.3 `web/lib/actions/classes/leave-class.ts`: `leaveClass(classroomId: string)` — load classroom, reject if `found.createdBy === currentUser.id` ("Owner cannot leave their own class"), then delete the caller's own `classroomMembership` row for that class (idempotent — no error if no row exists, matching `leaveContest`).

## 2. Hooks

- [x] 2.1 `web/hooks/use-delete-class.tsx`: `useDeleteClass()` mutation wrapping `deleteClass`, invalidate `["classes"]` (or whatever query key `useMyClasses`/`useClass` use — confirm exact key names) and the specific `["class", classroomId]` key on success, matching `use-delete-contest.tsx`'s pattern.
- [x] 2.2 `web/hooks/use-remove-member.tsx`: `useRemoveMember()` mutation wrapping `removeMember(classroomId, userId)`, invalidate `["class", classroomId]` on success so the roster refetches.
- [x] 2.3 `web/hooks/use-leave-class.tsx`: `useLeaveClass()` mutation wrapping `leaveClass(classroomId)`, invalidate `["classes"]` (my-classes list) on success.
- [x] 2.4 Verify invalidation against actual query keys used in `use-class.tsx` / `use-my-classes.tsx` (read those files — not yet confirmed in this session) per the `mutation-cache-invalidation` skill's rule: invalidate every query whose data the mutation affects. — Confirmed actual keys: `useClass` → `["classes", classroomId]`, `useMyClasses` → `["classes"]`. Since React Query's `invalidateQueries` matches by prefix by default, invalidating `["classes"]` covers both; `use-remove-member.tsx` additionally invalidates the specific `["classes", classroomId]` key.

## 3. UI

- [x] 3.1 `class-detail.tsx`: add a `DeleteClassDialog` component (confirmation modal — name the class, state "cannot be undone" + "lessons and submissions will be deleted") next to `EditClassDialog` in the owner action group; on confirm, call `useDeleteClass` and redirect to `/classes` on success.
- [x] 3.2 `class-detail.tsx`: add a per-row remove action (icon button, e.g. `UserMinus`) to each `<li>` in the owner-only students roster list; wire to `useRemoveMember`, with a lightweight confirm (dialog or `confirm()`-style) before firing.
- [x] 3.3 `class-detail.tsx`: add a "Leave Class" button for the `!isOwner` case in the header's action slot (currently `undefined` when not owner) — wire to `useLeaveClass`, redirect to `/classes` on success.
- [x] 3.4 Confirm with a quick look at `class-list.tsx` whether the joined-classes grid also needs a leave affordance per-card, or whether detail-page-only is sufficient (open question from design.md) — add if needed. — Read `class-list.tsx`: each joined class is a plain `<Link>`-wrapped card with no existing per-card action slot; adding an inline leave button there needs click-event stopPropagation plumbing not justified for v1. Detail-page-only.
- [x] 3.5 Add/confirm i18n strings for new UI copy in both locale message files (`messages/en.json`, `messages/pt.json` or equivalent) under `ClassesPage` — e.g. `deleteClassTitle`, `deleteClassConfirm`, `removeStudent`, `leaveClass`, `leaveClassConfirm`. — Added to `messages/en.json` and `messages/br.json` (repo's actual pt-locale file is `br.json`, not `pt.json`).

## 4. Verification

- [ ] 4.1 Manual test: as owner, delete a class with at least one lesson/exercise/submission and confirm cascade removes everything (spot-check DB or confirm no orphaned rows via `db:studio`). — Not run: needs a live dev server + seeded DB, not available in this session.
- [ ] 4.2 Manual test: as owner, remove a student; confirm they disappear from roster and from their own `listMyClasses` joined list; confirm re-joining via join code works again afterward. — Not run, same reason.
- [ ] 4.3 Manual test: as a joined student, leave a class; confirm it disappears from their list and the owner's member count updates. — Not run, same reason.
- [ ] 4.4 Manual test: attempt each action as an unauthorized user (non-owner delete, non-owner remove-member, owner leave, owner self-remove) and confirm each is rejected. — Not run, same reason; authorization logic reviewed by inspection (matches `delete-contest.ts`/`leave-contest.ts` patterns) but not exercised live.
- [x] 4.5 `bun lint` clean in `web/`. — `bun lint` has 6 pre-existing errors unrelated to this change (in `participants.tsx`, `pending-joins.tsx`, `submission-list.tsx`, `select-problem.tsx`, `safari.tsx`, `lib/prompt.ts`); none of the new/touched files (`delete-class.ts`, `remove-member.ts`, `leave-class.ts`, hooks, new components, `class-detail.tsx`) produced lint errors. `tsc --noEmit` also clean on touched files.
