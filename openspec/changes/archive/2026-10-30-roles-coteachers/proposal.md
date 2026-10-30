## Why

The classroom test on 2026-10-29 showed two gaps in how WhyRunner models people. First, a class has exactly one person who can manage it (`classroom.createdBy`), so a second professor or a teaching assistant cannot help run a class. Second, there is no platform-level administrator: survey results are gated by an env var (`SURVEY_ADMIN_EMAILS`), and nobody can moderate or fix content they did not create. Both limits came up in the classroom test and are needed before wider use.

## What Changes

- Add `user.role` (`user` | `admin`, default `user`). Admins can view and manage every contest, class, lesson and problem, use the existing delete/remove actions on any of them, and read survey results.
- Replace the `SURVEY_ADMIN_EMAILS` gate (`isSurveyAdmin`) with the admin role on `/surveys/results`, the survey export route, `getSurveyResults` and the survey hub. A one-off, idempotent seed script promotes users whose emails are in `SURVEY_ADMIN_EMAILS`. **BREAKING** (operational): after deploy, the env var alone no longer grants access; the seed script must run once. `SURVEY_PREVIEW_EMAILS` stays as is.
- New admin-only pages: `/admin` (hub linking to all contests, all classes, survey results and users), `/admin/contests`, `/admin/classes`, `/admin/users` (search users, promote/demote admins). Admins cannot demote themselves.
- Add `classroom_membership.role` (`student` | `teacher`, default `student`). A member with role `teacher` is a co-teacher.
- Co-teachers can do everything the owner can in a class (lessons, exercises, modes, constraints, gradebook, results export, similarity, lesson review and feedback, renaming the class, removing students), except deleting the class and adding, promoting, demoting or removing co-teachers. Those stay with the owner, and admins.
- Centralize all class and lesson permission checks in one module (`canManageClass`, `isClassOwner`, `assertCanManageClass`, `assertClassOwner`, `assertCanManageLesson`, …) and replace the 38 scattered `createdBy` comparisons in `lib/actions/classes` and `lib/actions/lessons`, plus the page-level ones (gradebook, similarity) and the class-scoped helpers (results data, home data). Lesson management is decided by the lesson's class, not by `lesson.createdBy`.
- Contest and problem ownership checks also go through central helpers so admins pass them; owner-only behavior for regular users is unchanged.
- Owner UI on the class page: invite an existing user as co-teacher by username or email, and promote/demote a member between student and teacher. Roster shows teachers and students separately.
- "My classes" lists classes the user teaches (owned or co-teacher) separately from classes they study in. Co-teachers are excluded from every "students" set (roster count, gradebook, export, review, similarity, home pending lessons).
- Migration `0051` adds both enums and columns, and marks any owner's own membership row as `teacher`.
- Out of scope: feature flags, a reports/flagging system (none exists today), removing participants from contests (no such action exists today), invitation acceptance flow, notifications for role changes, better-auth's `admin` plugin.

## Capabilities

### New Capabilities
- `admin-role`: platform admin role on `user`, how it is granted (seed script, admin UI), what it bypasses, and the `/admin` hub with its contests, classes and users pages.
- `class-coteachers`: membership role, the owner/co-teacher/student/admin permission matrix for classes and lessons, the invite/promote UI, and the taught/joined class list split.

### Modified Capabilities
- `classes`: deleting a class, removing a member and leaving a class now account for co-teachers and admins.
- `class-gradebook`: gradebook is available to class managers (owner, co-teachers, admins); students exclude co-teachers.
- `class-results-export`: export available to class managers; students exclude co-teachers.
- `code-similarity`: exercise report is for class managers; contest report is for the contest owner or an admin.
- `survey-results`: access is gated by the admin role instead of `SURVEY_ADMIN_EMAILS`.
- `evaluation-surveys`: form previews are open to admins (instead of "survey admins") and `SURVEY_PREVIEW_EMAILS`.
- `server-action-security`: contest problem-list mutations and draft-contest lookup accept admins as well as the creator.

## Impact

- **DB**: migration `0051` (`user_role`, `classroom_role` enums; `user.role`, `classroom_membership.role`). Numbering assumes `feat/signup-ra` lands `0049` and `feat/test-visibility` lands `0050` first; `drizzle/migrations/meta/_journal.json` must be rebased on top of them.
- **Schemas**: `web/drizzle/schemas/users.ts`, `web/drizzle/schemas/classes.ts`.
- **Auth**: `web/lib/auth/index.ts` (expose `role` as a non-input additional field), new `web/lib/auth/permissions.ts`; `web/lib/surveys/admin.ts` rewritten; `web/env.ts` drops `SURVEY_ADMIN_EMAILS` from runtime env.
- **Actions**: every file in `web/lib/actions/classes` and `web/lib/actions/lessons`; contest, problem and similarity actions that compare `createdBy`; `web/lib/classes/load-class-results-data.ts`; `web/lib/actions/home/get-home-data.ts`; survey actions; new admin and co-teacher actions.
- **Pages/UI**: `/admin/**` (new), class detail roster and co-teacher dialog, class list, lesson roadmap (`isOwner` → `canManage`), gradebook and similarity pages, avatar menu / command palette admin entry; `web/messages/en.json` and `br.json`.
- **Judge**: none. The judge reads neither table touched here, so `judge/src/models.rs` needs no enum sync.
- **Ops**: run `bun scripts/seed-admins.ts` once per environment after migrating; update `web/CLAUDE.md` env docs.
