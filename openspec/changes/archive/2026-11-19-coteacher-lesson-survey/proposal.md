## Why

Co-teachers can't answer the teacher evaluation survey (`lesson_author`) for lessons in classes they co-teach: eligibility checks `lesson.createdBy`, so only whoever created the lesson qualifies. In a co-taught class (e.g. "Programação 1 - TecInfo1 - 2026", owner + one co-teacher) only one teacher's experience is captured, which undercounts teacher responses for the TCC evaluation.

## What Changes

- `lesson_author` eligibility becomes "the user teaches the lesson's class": the class owner (`classroom.createdBy`) or a member with role `teacher`, for published lessons with at least one exercise. The lesson's creator no longer matters on its own (a creator who left the class's teachers loses eligibility).
- Each teacher answers independently; the existing one-response-per-user × form × lesson rule is unchanged, so a lesson can now have several `lesson_author` responses.
- The lesson-page call-to-action card shows to every teacher of the class (still only after the first student hand-in), and the `/surveys` hub lists those lessons for co-teachers.
- Platform admins with no class relation stay ineligible (they don't teach the lesson).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `evaluation-surveys`: `lesson_author` eligibility and the lesson card's audience move from "lesson creator" to "any teacher of the lesson's class".

## Impact

- `web/lib/surveys/eligibility.ts` (`lesson_author` query), comments in `web/lib/actions/surveys/get-survey-cta.ts`.
- No schema change or migration: the unique index on `(user_id, form, lesson_id)` already allows one response per teacher.
- Results, admin view and CSV export (`web/lib/surveys/results.ts`, `aggregate.ts`, `csv.ts`) are per-response and anonymous; they already handle several responses per lesson, so no change.
- `web/package.json` patch bump.
