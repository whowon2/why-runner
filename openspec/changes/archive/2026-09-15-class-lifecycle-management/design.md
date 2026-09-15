## Context

`classroom`/`classroomMembership` (`web/drizzle/schemas/classes.ts`) have create/join/update actions (`web/lib/actions/classes/`) but no delete/remove/leave. The equivalent `contest`/`userOnContest` pair already has this full set (`delete-contest.ts`, `leave-contest.ts`), so the pattern to follow already exists in the codebase — this is filling a gap, not inventing new architecture. All FKs from `classroomMembership` and `lesson` to `classroom.id` are already `onDelete: "cascade"` (`classes.ts:38`, `lessons.ts:22`), and `lesson`'s own dependents (`exercise`, `exerciseSubmission`, etc.) cascade further per `lessons.ts` — so a `classroom` row delete cleans up the whole tree at the DB level with no application-level cleanup code needed.

Authorization primitives already exist: `assertClassOwner` and `assertClassMember` in `assert-class-member.ts`.

## Goals / Non-Goals

**Goals:**
- Teacher can delete their own class (and everything under it) in one action.
- Teacher can remove a specific student from their class.
- Non-owner member can leave a class they joined.
- Match existing server-action conventions exactly (auth via `getCurrentUser`, ownership via `assertClassOwner`, no new abstractions).

**Non-Goals:**
- No soft-delete / undo / trash for classes (contest doesn't have this either — hard delete matches existing precedent).
- No confirmation-of-consequences summary (e.g. "this will delete 4 lessons and 12 submissions") — out of scope, contest's delete doesn't do this either.
- No bulk member removal.
- No transfer-of-ownership flow.

## Decisions

**Hard delete, relying on existing cascade FKs.** Alternative considered: soft-delete flag (`deletedAt`) like some SaaS patterns use. Rejected — `contest` doesn't do this, no other table in the schema uses soft-delete, and introducing it here would be an inconsistent one-off. Hard `db.delete(classroom).where(eq(classroom.id, id))` mirrors `delete-contest.ts` exactly.

**Owner cannot delete via `removeMember`, cannot leave via `leaveClass`.** The owner is identified structurally (`classroom.createdBy`), not by a membership row. `removeMember` and `leaveClass` should reject when the target/caller is the owner — they must use `deleteClass` instead. This mirrors `contest`: `deleteContest` is owner-only, `leaveContest` deletes the caller's own `userOnContest` row and doesn't special-case ownership because contest ownership isn't tracked via a membership row either — but classes are more likely for the owner to hold a genuine membership row (per `join-class.ts`'s comment: owner doesn't get a membership row when creating, but self-join via code is possible in theory even though `joinClass` explicitly skips inserting one when `found.createdBy === currentUser.id`, so in practice this defensive check is a belt-and-suspenders guard, not something reachable through normal UI flow).

**No time-based restriction on delete (unlike contest's "already started" check).** `deleteContest` blocks deletion once a published contest has started, to protect leaderboard integrity mid-competition. Classes have no equivalent "in progress, don't disrupt" state — a class doesn't start/end, and deleting mid-term is a deliberate teacher action with no external synchronization to protect. No analogous check is added.

**Server actions take primitive args, not an input-object type.** Mirrors `leaveContest`'s `LeaveContestInput` pattern only where a hook type already demands it; `deleteClass(classroomId: string)`, `removeMember(classroomId: string, userId: string)`, `leaveClass(classroomId: string)` follow `deleteContest`'s simpler single-arg style since there's no existing hook input type to satisfy.

**UI placement:**
- Delete: new `DeleteClassDialog` (confirmation required — destructive, irreversible, cascades lessons/submissions) rendered next to `EditClassDialog` in `class-detail.tsx`'s owner-only action group.
- Remove member: a per-row action (icon button) added to the existing `<li>` roster list in `class-detail.tsx`'s owner-only students `Card`.
- Leave: a "Leave Class" action visible to non-owner members — placed in `class-detail.tsx` for members (`!isOwner` branch currently renders nothing where the owner's action group is) and/or the class list view (`class-list.tsx` — not yet read, confirm during implementation whether a leave affordance belongs there too for the joined-classes list).

## Risks / Trade-offs

- **[Risk]** Hard delete of a class with active lessons/submissions is irreversible and no confirmation shows scope (e.g. "3 lessons, 8 students, 40 submissions will be deleted"). → **Mitigation**: confirmation dialog names the class and states "this cannot be undone" and "all lessons and student submissions will be deleted"; scope-listing is deferred (matches `deleteContest`'s bar, which also gives no scope preview).
- **[Risk]** `removeMember` on a student mid-lesson silently orphans nothing (cascade only touches `classroomMembership`, not the student's `exerciseSubmission` rows scoped to `userId`+`exerciseId`, which persist) — a removed-then-rejoined student would see old submissions reappear. → **Mitigation**: acceptable for v1, matches how contest handles `leaveContest` (submissions aren't cleaned up there either, per `submission` table having no cascade tie to `userOnContest`). Flagging as an open question below rather than blocking on it.
- **[Risk]** No rate limit on `leaveClass`/`removeMember` — low severity (idempotent-ish delete-if-exists), not treated as a real risk.

## Migration Plan

No DB migration needed — no schema changes. Ship as three new server actions + hooks + UI wiring, deployable independently of any migration ordering concern.

## Open Questions

- Should removing/leaving a class also purge the student's `exerciseSubmission` rows for that class's lessons, or leave them (current lean: leave them, consistent with contest's submission history not being purged on `leaveContest`)? Confirm during implementation by checking whether `get-class`'s member list or any grading view would show stale data problematically.
- Does `class-list.tsx` (joined-classes view) need its own leave-class entry point, or is the detail page sufficient? Confirm by reading that component during implementation.
