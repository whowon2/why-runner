## Context

Every survey entry point (hub `listEligible`, survey page `getSurvey`, `submitSurveyResponse`, lesson/contest `getSurveyCta`) goes through `eligibleRows` in `web/lib/surveys/eligibility.ts`. Its `lesson_author` branch filters `lesson.createdBy = userId`. The `class-coteachers` spec defines class teachers as the owner (`classroom.createdBy`) plus `classroomMembership` rows with role `teacher`; `canManageClass` in `web/lib/class-roles.ts` also grants platform admins.

## Goals / Non-Goals

**Goals:**
- Owner and every co-teacher of a lesson's class are eligible for `lesson_author`, each answering once.

**Non-Goals:**
- Changing `contest_author` (contests have no co-authors).
- Any results/CSV change, e.g. tagging responses by teacher role — responses stay anonymous.

## Decisions

- **Rule = owner OR teacher membership, not `canManageClass`.** Admins can manage any class but don't teach it; letting them answer would pollute teacher responses. So the SQL uses `classroom.createdBy = userId OR EXISTS(classroomMembership where userId, classroomId, role = 'teacher')` directly, joined via the `classroom` join the query already has.
- **Drop the `lesson.createdBy` check entirely** rather than OR-ing it in. Lesson creators are always teachers of the class at creation time; if they're later demoted/removed, they no longer teach it and shouldn't be invited. Simpler rule, matches the class-coteachers model.
- **No new pure helper.** The rule lives in one SQL predicate; there's no DB test harness (`web/CLAUDE.md`), so verification is the browser check with the teacher + co-teacher test accounts plus `bun test lib`/typecheck/lint.

## Risks / Trade-offs

- [Existing response by a since-removed lesson creator] → stays stored and counted in results (results don't re-check eligibility); only new invitations follow the new rule. Acceptable.
- [More `lesson_author` responses per lesson] → aggregates already count per response; per-lesson filter in results shows several rows. Expected.
