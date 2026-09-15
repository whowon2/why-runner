## Why

`classroom` has create and update actions but no way to delete a class, no way for a teacher to remove a student, and no way for a student to leave a class they joined by mistake. `contest` — the other owned/joined resource in this codebase — already has all three (`delete-contest`, `leave-contest`, plus roster management via `get-participants`). Classes are missing the same lifecycle, and the gap is user-facing: a teacher can't clean up a test class or fix a join-code mixup, and a student who joins the wrong class via join-code has no way out.

## What Changes

- Add `deleteClass(classroomId)` server action: owner-only, hard-deletes the `classroom` row. Existing `onDelete: "cascade"` FKs on `classroomMembership.classroomId` and `lesson.classroomId` (and their dependents: `exercise`, `exerciseConstraint`, `userThemeSkill`/etc. per `lessons.ts`) handle cleanup — no new cascade logic needed.
- Add `removeMember(classroomId, userId)` server action: owner-only, deletes one `classroomMembership` row. Owner cannot remove themself this way (no membership row for the owner in the normal case; also block removing the owner's own id defensively).
- Add `leaveClass(classroomId)` server action: self-service, deletes the caller's own `classroomMembership` row. Owner cannot leave their own class (must delete it instead) — mirrors why `contest` has separate `deleteContest`/`leaveContest` paths with the same asymmetry.
- Wire minimal UI: a delete-class action (with confirmation) in the class settings/detail view for owners, a remove-member control in the existing roster view (`get-class`'s `members` list, owner-only), and a leave-class action for non-owner members.
- No hooks (`use-*.tsx`) exist yet for any class mutation beyond create/join/update — new ones needed for these three, following the mutation-cache-invalidation pattern already used for contest hooks.

## Capabilities

### New Capabilities

(none — this extends the existing `classes` server-action surface, not a new capability domain)

### Modified Capabilities

- `classes`: adds delete, remove-member, and leave requirements to the class lifecycle. No `openspec/specs/classes/` currently exists (no specs checked in yet per repo CLAUDE.md), so this ships as a full first spec for the capability rather than a delta.

## Impact

- **New files**: `web/lib/actions/classes/delete-class.ts`, `web/lib/actions/classes/remove-member.ts`, `web/lib/actions/classes/leave-class.ts`, plus corresponding `web/hooks/use-*.tsx` mutation hooks.
- **Modified files**: `web/app/[locale]/classes/_components/class-detail.tsx` (owner delete action), roster display component (remove-member control), class list/detail (leave action for members) — exact component touch points confirmed during implementation.
- **DB**: no schema changes — cascade FKs already in place (`web/drizzle/schemas/classes.ts`, `web/drizzle/schemas/lessons.ts`).
- **No judge/Rust impact.**
