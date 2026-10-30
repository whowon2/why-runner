## 1. Schema and migration

- [x] 1.1 Add `UserRole` pgEnum (`user_role`: user, admin) and `user.role` (default `user`, not null) in `web/drizzle/schemas/users.ts`
- [x] 1.2 Add `ClassroomRole` pgEnum (`classroom_role`: student, teacher) and `classroomMembership.role` (default `student`, not null) in `web/drizzle/schemas/classes.ts`; export `ClassroomRole` type
- [x] 1.3 `bun db:generate`, rename the output to `0051_roles_coteachers.sql`, set `idx`/`tag` in `meta/_journal.json`; append `UPDATE classroom_membership ... SET role = 'teacher'` for owner self-join rows
- [x] 1.4 Apply locally (`bun db:migrate`) and confirm both columns exist with defaults and owner rows are `teacher`

## 2. Permission module

- [x] 2.1 Create `web/lib/auth/permissions.ts` (`server-only`): `isAdmin(userId)` wrapped in React `cache()`, reading `user.role` from DB
- [x] 2.2 Pure helpers in `web/lib/class-roles.ts`: `resolveClassRole({ userId, createdBy, membershipRole, admin })`, `canManageClass(role)`, `isClassOwner(role)`
- [x] 2.3 Unit tests `web/lib/class-roles.test.ts` for the matrix: owner, teacher, student, admin, admin-who-is-owner, stranger × canManage / isOwner
- [x] 2.4 In `permissions.ts`: `getClassAccess`, `assertClassMember`, `assertCanManageClass`, `assertClassOwner` (owner or admin), `assertCanManageLesson`, `assertCanManageExercise`, `isStudentMembership` / staff filter helper
- [x] 2.5 In `permissions.ts`: `canManageContest`, `assertCanManageContest`, `canManageProblem`, `assertCanManageProblem`, `ownerOrAdminFilter(column, userId)`
- [x] 2.6 Replace `web/lib/actions/classes/assert-class-member.ts` with imports from `permissions.ts` (delete the file, update importers)
- [x] 2.7 Add `role` to better-auth `additionalFields` (`input: false`, default `user`) in `web/lib/auth/index.ts`; confirm the client type infers it

## 3. Class actions

- [x] 3.1 `get-class.ts`: return `{ classroom, role, canManage, isOwner, memberCount, teachers, students }`; roster only for managers; students exclude owner and teachers
- [x] 3.2 `list-my-classes.ts`: return `{ taught, joined }` per design D8, with per-class role and student counts excluding staff
- [x] 3.3 `update-class.ts` → `assertCanManageClass`; `delete-class.ts` → `assertClassOwner`
- [x] 3.4 `remove-member.ts`: managers remove students; teacher targets need `assertClassOwner`; reject removing `createdBy`
- [x] 3.5 `leave-class.ts`: owner still rejected; co-teachers allowed
- [x] 3.6 `join-class.ts`: keep `onConflictDoNothing` so a teacher row is never downgraded; drop the inline owner comparison in favor of the access helper
- [x] 3.7 New `add-co-teacher.ts` (owner-level; exact username or lowercased email; upsert `teacher`; generic not-found) and `set-member-role.ts` (owner-level; target must be a non-owner member)
- [x] 3.8 `get-class-gradebook.ts`, `export-class-results.ts` → `assertCanManageClass`; `lib/classes/load-class-results-data.ts` students = `student` role minus owner

## 4. Lesson actions

- [x] 4.1 `create-lesson.ts` → `assertCanManageClass`
- [x] 4.2 `update-lesson.ts` (`updateLesson`, `setLessonPublished`, `deleteLesson`) → `assertCanManageLesson`; remove local `assertOwnsLesson`
- [x] 4.3 `create-exercise.ts` (all three checks), `exercise-mode.ts` → lesson/exercise manager checks
- [x] 4.4 `create-structural-constraint.ts`, `update-structural-constraint.ts`, `delete-exercise-constraint.ts`, `upsert-algorithm-requirement-constraint.ts` → `assertCanManageExercise`
- [x] 4.5 `get-lesson.ts`, `list-lessons.ts`: `isOwner` → `canManage` (drafts visible, no student progress for managers); return `role`/`canManage`/`isOwner`
- [x] 4.6 `get-lesson-review.ts`, `review-lesson-submission.ts` → manager checks; review student list excludes staff
- [x] 4.7 `get-exercise-submissions.ts`: lesson-side check → class manager (keep the problem-author branch, with admin bypass)
- [x] 4.8 Check `get-exercise.ts`, `get-exercise-constraints.ts`, `create-exercise-submission.ts`, `submit-lesson.ts` for owner assumptions and route them through `getClassAccess`

## 5. Class-adjacent code

- [x] 5.1 `lib/actions/similarity/get-exercise-similarity.ts`: class manager check; exclude all staff submissions
- [x] 5.2 `app/[locale]/classes/[classSlug]/gradebook/page.tsx` and exercise `similarity/page.tsx`: replace inline `createdBy` with `getClassAccess(...).canManage`
- [x] 5.3 `lib/actions/home/get-home-data.ts`: pending lessons only for `student` memberships
- [x] 5.4 Exercise-unlock notifications and any other member fan-out: target students only
- [x] 5.5 `lib/surveys/eligibility.ts`: confirm `lesson_author` stays per `lesson.createdBy`; no co-teacher change needed beyond that (document in code comment if non-obvious)

## 6. Contest and problem admin bypass

- [x] 6.1 Contest actions: `add-problem`, `remove-problem`, `reorder-problems`, `publish-contest`, `delete-contest`, `update-contest`, `export-contest`, `get-participants`, `get-pending-joins`, `approve-join`, `reject-join`, `get-submissions`, `get-contest-by-id`, `get-contest-leaderboard` → `canManageContest` / `ownerOrAdminFilter`; lifecycle rules unchanged
- [x] 6.2 Problem actions: `update-problem`, `delete-problem`, `publish-problem`, `get-problem`, `get-problem-by-slug`, `get-problem-for-edit`, `get-problem-validation`, `trigger-problem-validation`, `update-problem-reference-solution`, `generate-reference-solution`, `generate-problem-narrative`, `suggest-problem-tags`, `review-problem`, `create-problem-submission` → `canManageProblem` / `ownerOrAdminFilter`
- [x] 6.3 `get-contest-problem-similarity.ts` → `canManageContest`; contest pages `contests/[slug]/page.tsx` and `contests/[slug]/similarity/page.tsx` likewise; UI `isOwner` flags from these actions become "can manage"
- [x] 6.4 Leave list visibility filters (`get-contests.ts`, `get-problems.ts`) and insert-time `createdBy` untouched

## 7. Surveys

- [x] 7.1 Rewrite `lib/surveys/admin.ts`: `isSurveyAdmin(userId)` → `isAdmin`; `canPreviewSurveys` = admin or `SURVEY_PREVIEW_EMAILS`; update callers (results page, `api/surveys/export/route.ts`, `get-survey-results.ts`, `list-my-surveys.ts`, preview page)
- [x] 7.2 Remove `SURVEY_ADMIN_EMAILS` from `web/env.ts`
- [x] 7.3 `web/scripts/seed-admins.ts` + `db:seed:admins` script: idempotent promote from `SURVEY_ADMIN_EMAILS`, report promoted / not found
- [x] 7.4 Update `web/CLAUDE.md` env section (SURVEY_ADMIN_EMAILS is seed-only; run the seed after migrating)

## 8. Admin area

- [x] 8.1 Admin actions in `web/lib/actions/admin/`: `listAllContests`, `listAllClasses`, `listUsers` (search + pagination), `setUserRole` (rejects self-demotion); each checks `isAdmin`
- [x] 8.2 `app/[locale]/admin/layout.tsx`: `requireOnboardedUser` + `isAdmin`, `notFound()` otherwise
- [x] 8.3 `/admin` hub with `PageHeader` and four link cards (contests, classes, survey results, users), per creating-a-page skill
- [x] 8.4 `/admin/contests`, `/admin/classes`, `/admin/users` with `ListPageHeader` search, `max-w-5xl`, `pagination-controls`; users page has promote/demote button
- [x] 8.5 React Query hooks for admin lists and `setUserRole` following the mutation-cache-invalidation skill
- [x] 8.6 Admin entry in `components/header/avatar-button.tsx` and command palette `commands.ts`, shown when `session.user.role === "admin"`
- [x] 8.7 `en.json` / `br.json`: `Admin.*` titles, subtitles, columns, buttons, errors

## 9. Class UI

- [x] 9.1 `class-detail.tsx`: switch `isOwner` → `canManage` for management UI; delete class and co-teacher controls on `isOwner`; roster split teachers / students
- [x] 9.2 Add-co-teacher dialog (username or email) and per-member promote/demote/remove menu; co-teachers see remove on students only
- [x] 9.3 `lesson-roadmap.tsx` and other lesson UI: `isOwner` → `canManage`
- [x] 9.4 `classes/page.tsx` list: "Taught" (owner / co-teacher badge) and "Joined" sections
- [x] 9.5 Hooks for `addCoTeacher`, `setMemberRole`, `removeMember` invalidate class detail, class list, gradebook (mutation-cache-invalidation skill)
- [x] 9.6 `en.json` / `br.json`: co-teacher strings

## 10. Verification

- [x] 10.1 Grep gate: no authorization `createdBy` comparison left in `lib/actions/{classes,lessons,contest,problems,similarity}`, `lib/classes`, `app/[locale]` outside `permissions.ts` (only inserts and data uses)
- [x] 10.2 `bun test`, `bun run lint`, `bunx tsc --noEmit` pass
- [x] 10.3 Browser check with test accounts: owner adds student as co-teacher; co-teacher edits/publishes a lesson, opens gradebook, reviews, removes a student; co-teacher cannot see delete-class or add-co-teacher; co-teacher's class list shows class under Taught
- [ ] 10.4 (gates verified with curl: `/admin/**` and `/surveys/results` 200 for admin, 404 for teacher/student; admin opens another user's draft contest; promote/demote and self-demote not yet clicked through in the browser) Browser check as admin: `/admin` hub and three lists, promote/demote another user, self-demote rejected, `/surveys/results` opens, non-admin gets 404 on `/admin` and `/surveys/results`, admin opens another user's draft contest and class
- [x] 10.5 Before merge: rebase on main after 0049/0050 land, fix `_journal.json` order and bump 0051's `when` above 0049/0050's (drizzle skips a migration whose `when` is older than the last applied one), re-run migrate on a fresh DB
