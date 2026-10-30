## Context

Permissions today are "you made it, you manage it", checked inline:

- **Classes/lessons**: 38 `createdBy` references across `web/lib/actions/classes` and `web/lib/actions/lessons`. Two shapes coexist: class-level (`classroom.createdBy`, via `assertClassOwner` / `assertClassMember` in `assert-class-member.ts`) and lesson-level (`lesson.createdBy` in `update-lesson.ts`, `create-exercise.ts`, `exercise-mode.ts`, the constraint actions, `review-lesson-submission.ts`, `get-exercise-submissions.ts`). They agree only because only the class owner can create lessons today. Page-level copies live in `classes/[classSlug]/gradebook/page.tsx` and the exercise similarity page; helpers `lib/classes/load-class-results-data.ts`, `lib/actions/home/get-home-data.ts` and `lib/actions/similarity/get-exercise-similarity.ts` decide who counts as a student by `userId !== createdBy`.
- **Contests/problems**: ~40 more `createdBy` comparisons, many as SQL filters (`and(eq(problem.id, id), eq(problem.createdBy, currentUser.id))`).
- **Survey results**: `isSurveyAdmin(user)` in `lib/surveys/admin.ts` matches `SURVEY_ADMIN_EMAILS`; used by the results page, `app/api/surveys/export/route.ts`, `getSurveyResults` and `listMySurveys`.
- **Auth**: better-auth with `additionalFields` (`username`, `finishedOnboarding`) and a 5-minute session cookie cache.
- The owner may already hold a `classroom_membership` row (self-joined via code); every "students" computation filters it out by `createdBy`.

## Goals / Non-Goals

**Goals:**
- One module answers "who may do what" for classes and lessons, and admin bypass for contests and problems, so no action compares `createdBy` inline for authorization.
- Co-teachers have owner powers minus class deletion and co-teacher management.
- Admin role replaces the email allowlist for survey results, plus a minimal admin area.
- No change in behavior for existing owners and students.

**Non-Goals:**
- Feature flags (explicitly out of scope).
- Reports/flagging, contest participant removal, invitation acceptance, role-change notifications, audit log.
- better-auth `admin` plugin (bans, impersonation, its own schema columns).
- Contest co-organizers. Contests stay single-owner, plus admin.
- Transferring class ownership.

## Decisions

### D1. Two Postgres enums, two columns, migration 0051

```ts
// users.ts
export const UserRole = pgEnum("user_role", ["user", "admin"]);
role: UserRole("role").default("user").notNull(),

// classes.ts
export const ClassroomRole = pgEnum("classroom_role", ["student", "teacher"]);
role: ClassroomRole("role").default("student").notNull(),   // on classroom_membership
```

`pgEnum` matches `ContestStatus` / constraint kinds. The migration also runs `UPDATE classroom_membership m SET role = 'teacher' FROM classroom c WHERE c.id = m.classroom_id AND m.user_id = c.created_by` so an owner's self-join row never counts as a student. Ownership stays defined by `classroom.createdBy`; the owner does not need a membership row.

Numbering: `drizzle-kit generate` will produce `0049_*` on this branch because 0049/0050 live on other branches. Rename the file to `0051_roles_coteachers.sql` and set `idx`/`tag` in `meta/_journal.json`; before merge, rebase on main once `feat/signup-ra` and `feat/test-visibility` land, and regenerate the snapshot if drizzle-kit complains about snapshot chain. The two other branches touch different tables, so the SQL itself does not conflict.

*Alternative:* a separate `classroom_teacher` table. Rejected: a co-teacher is still a member (sees the class, appears in rosters), and one row with a role keeps "is member" and "is teacher" in one lookup.

### D2. Admin seed via script, not SQL migration

Migrations cannot read env vars, and hard-coding emails in a checked-in migration leaks them. Add `web/scripts/seed-admins.ts` (`bun scripts/seed-admins.ts`, also `db:seed:admins` in package.json): reads `SURVEY_ADMIN_EMAILS` from `process.env`, lowercases/trims, `UPDATE "user" SET role='admin' WHERE lower(email) IN (...)`, prints promoted and not-found emails. Idempotent; never demotes. `SURVEY_ADMIN_EMAILS` is removed from `env.ts` (runtime no longer reads it) and documented in `web/CLAUDE.md` as seed-only.

*Alternative:* call the seed from `migrate-if-production.mjs`. Rejected for now: it would silently re-promote someone an admin demoted in the UI on every production build.

### D3. Authorization reads role from the DB; session field only for UI

`role` is added to better-auth `additionalFields` with `input: false` so sign-up cannot set it and `session.user.role` is available for nav hints. But the session cookie is cached for 5 minutes, so a demoted admin would keep power that long. All authorization goes through `isAdmin(userId)`, a `cache()`-wrapped (per request) primary-key lookup on `user.role`. One extra indexed query per request is negligible.

### D4. Central permission module: `web/lib/auth/permissions.ts` (`server-only`)

```ts
isAdmin(userId): Promise<boolean>                       // cached per request

type ClassRole = "owner" | "teacher" | "student" | "admin";
getClassAccess(classroomId, userId)
  → { classroom, role: ClassRole | null, canManage, isOwner }
  // owner: createdBy === userId; teacher/student: membership.role;
  // admin: isAdmin and none of the above (an admin who is also owner reports "owner")
  // canManage = owner | teacher | admin;  isOwner = owner | admin (owner-level powers)

assertClassMember(classroomId, userId)     // any role, incl. admin → access
assertCanManageClass(classroomId, userId)  // canManage
assertClassOwner(classroomId, userId)      // owner or admin: delete class, manage co-teachers
assertCanManageLesson(lessonId, userId)    // lesson → classroom → assertCanManageClass
assertCanManageExercise(exerciseId, userId)
classStaffIds(classroom, memberships)      // createdBy + teacher-role members; students = rest

canManageContest(contest, userId)  / assertCanManageContest
canManageProblem(problem, userId)  / assertCanManageProblem
ownerOrAdminFilter(column, userId): Promise<SQL | undefined>
  // eq(column, userId) for regular users, undefined for admins (drizzle `and` drops undefined)
```

`assert-class-member.ts` becomes a re-export (or is deleted and imports updated). Naming keeps `assertClassOwner` but its meaning becomes "owner-level" (owner or admin). The prompt's `canManageClass()` / `isClassOwner()` map to `access.canManage` / `access.isOwner`, plus pure predicate helpers `canManageClass(role)` / `isClassOwner(role)` for UI and tests.

Return values from `getClass`, `getLesson`, `listClassLessons` replace `isOwner: boolean` with `{ role, canManage, isOwner }`. UI uses `canManage` wherever it used `isOwner` today, and `isOwner` only for delete-class and co-teacher controls.

*Alternative:* Postgres row-level security. Rejected: the app connects as one role and every query is in server actions; RLS would be a far larger change.

### D5. Lessons are managed through their class

Every check on `lesson.createdBy` becomes `assertCanManageLesson`. `lesson.createdBy` keeps recording who authored the lesson (used by `lesson_author` survey eligibility, which stays per author). A co-teacher can therefore edit, publish, review and delete lessons the owner wrote, and vice versa, matching "co-teachers can do everything the owner can".

### D6. Who is a student

Students of a class = memberships with `role = 'student'` whose `userId !== classroom.createdBy`. Applied in `getClass` (roster, count), `listMyClasses` (count), `loadClassResultsData` (gradebook + export), `getLessonReview`, `get-exercise-similarity` (exclude all staff, not only `lesson.createdBy`), `get-home-data` pending lessons (only `student` memberships), and exercise-unlock notification fan-out if it targets members. Admins who are not members are never students.

### D7. Membership mutations and their guards

| Action | Who | Notes |
|---|---|---|
| `addCoTeacher(classroomId, usernameOrEmail)` | owner/admin | exact match on username or lowercased email; upserts membership with `teacher` (promotes an existing student) |
| `setMemberRole(classroomId, userId, role)` | owner/admin | target must be a member; cannot target the owner |
| `removeMember(classroomId, userId)` | manager | managers may remove students; removing a `teacher` row requires owner/admin; nobody removes the owner |
| `leaveClass` | any member | co-teachers may leave; owner still cannot |
| `joinClass` | anyone | inserts `student`; never downgrades an existing `teacher` row (`onConflictDoNothing` already) |
| `updateClass` (rename) | manager | |
| `deleteClass` | owner/admin | |

Inviting by email returns the same generic "user not found" error for unknown users; it is owner-only, so enumeration risk is limited to class owners.

### D8. Class list split

`listMyClasses` returns `{ taught, joined }`: `taught` = owned ∪ memberships with `teacher` (each with `role: "owner" | "teacher"` for a badge), `joined` = `student` memberships of classes not owned. Admins do not see every class here; they use `/admin/classes`.

### D9. Admin pages

Routes under `web/app/[locale]/admin/`: `page.tsx` (hub: four link cards), `contests/page.tsx`, `classes/page.tsx`, `users/page.tsx`. A shared `admin/layout.tsx` calls `requireOnboardedUser` then `isAdmin`, `notFound()` otherwise (same pattern as survey results — no existence leak). Every admin server action re-checks `isAdmin` (layouts do not protect actions). Pages follow the creating-a-page skill: `flex w-full flex-1 flex-col items-center gap-4 p-4` outer, `max-w-5xl` inner, `PageHeader` for the hub, `ListPageHeader` (search) for the three lists, `title` + `subtitle` keys in `en.json` and `br.json`, existing `pagination-controls`.

- `/admin/contests`: every contest incl. drafts (title, owner, status, dates), linking to `/contests/[slug]`. New action `listAllContests` (admin).
- `/admin/classes`: every class (name, owner, member count, lesson count), linking to `/classes/[slug]`. New action `listAllClasses`.
- `/admin/users`: search by name/username/email, shows role, promote/demote button. Actions `listUsers`, `setUserRole`; `setUserRole` rejects self-demotion. Emails are shown here only (admin-only page, never via `publicUserColumns`).
- Entry point: "Admin" item in the avatar menu and command palette, shown when `session.user.role === "admin"` (UI hint only; D3).

React Query mutation hooks for `setUserRole`, `addCoTeacher`, `setMemberRole` follow the mutation-cache-invalidation skill (invalidate class detail, class list, admin users list).

### D10. Admin bypass for contests and problems

Every authorization `createdBy` comparison in `lib/actions/contest`, `lib/actions/problems`, `lib/actions/similarity` and the contest pages goes through `canManageContest` / `canManageProblem` / `ownerOrAdminFilter`. Lifecycle rules (cannot edit problem list after start, delete restrictions) still apply to admins; admins bypass only ownership. Visibility filters like "published or mine" in list queries (`get-contests.ts`, `get-problems.ts`) stay as they are for normal browsing; admins see drafts through direct URLs and `/admin/contests`. `createdBy` values used as data (e.g. "exclude the owner's own submissions") are untouched. Actions that write `createdBy` on insert stay as they are.

## Risks / Trade-offs

- [Missed check: one inline `createdBy` comparison survives and blocks co-teachers or admins] → Task ends with a grep gate: no `createdBy` comparison in `lib/actions/{classes,lessons,contest,problems,similarity}` and `app/` outside `permissions.ts`, except inserts and data uses listed in a short allowlist comment.
- [Over-granting: a co-teacher gets owner-only power] → Unit tests for the permission matrix (owner, teacher, student, admin, stranger × each guard) and action tests for `deleteClass`, `addCoTeacher`, `setMemberRole`, `removeMember` on a teacher row.
- [Migration numbering collides with sibling branches] → D1 rebase step; task to verify `_journal.json` order before merge.
- [Forgotten seed: survey results suddenly 404 for the researcher after deploy] → Migration plan step and a line in the PR description; seed is idempotent and safe to rerun.
- [Extra DB query per request for `isAdmin`] → per-request `cache()`; PK lookup.
- [Admin sees emails on `/admin/users`] → acceptable for an admin-only page; nowhere else changes `publicUserColumns`.
- [Admin acting in a class they are not in shows student-facing UI oddly] → `role: "admin"` gets the manager view (`canManage`), no student progress.

## Migration Plan

1. Merge after `feat/signup-ra` (0049) and `feat/test-visibility` (0050); rebase and fix `_journal.json`.
2. Deploy: `migrate-if-production.mjs` applies 0051 (all defaults, no data loss; owner self-join rows become `teacher`).
3. Run `bun scripts/seed-admins.ts` once against production with the current `SURVEY_ADMIN_EMAILS`.
4. Verify `/admin` and `/surveys/results` open for the seeded account.

Rollback: revert the app deploy; the new columns have defaults and the old code ignores them. To fully undo, a down migration drops both columns and enums (owner rows set to `teacher` are harmless to the old code, which filters owners by `createdBy`).

## Open Questions

- Should `/contests` and `/problems` lists show drafts to admins inline? Proposed: no, use `/admin/contests` (and direct URLs) to avoid cluttering browsing.
- Contest participant removal is not implemented anywhere; if moderation needs it, it is a follow-up change.
