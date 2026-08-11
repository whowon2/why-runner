## Why

The roadmap today is a single global, flat lesson list (`getRoadmap()` reads every `lesson` row, ordered by one global `order` column) that any authenticated user can add to via `createLesson()` — there's no notion of who curated it or for whom. Per the product pivot away from an autonomous AI-guided path toward professor/student tooling (see project memory), a professor needs to assemble and order their *own* sequence of exercises for their class, the same way they already own problems (`problem.createdBy`) and contests (`contest.createdBy`). Today's schema also hard-limits one `lesson` per `problem` (`lesson.problemId` is `unique()`), so two professors can't each build a track around the same problem with different lesson requirements — a blocker also surfaced while scoping the (parked) solution-constraint-enforcement change, which wants to attach constraints per lesson-exercise rather than per problem.

## What Changes

- New **lesson track**: a professor-owned, ordered collection of lesson entries, following the same ownership pattern as `contest` (`createdBy`, creator-only edit).
- **BREAKING**: `lesson.problemId` unique constraint is dropped — a problem can now back multiple lesson entries (across different tracks, each with its own order position and requirements). Existing lessons migrate into a single default track so the current global roadmap keeps working unchanged for existing data.
- Lesson entries move from a single global `order` to per-track ordering; a professor can reorder entries within their own track.
- Roadmap becomes track-scoped: users browse published tracks and view one track's lessons in that track's order, instead of one global list.
- Professor authoring UI: create/edit a track, add existing problems as lesson entries (reusing the existing per-lesson theme tags, theme/language requirement, primary-language fields unchanged), reorder entries, publish/unpublish the track.
- Existing per-lesson mechanics (theme tags, requirements/locking, completion tracking, skill rewards) are unchanged in behavior — only their scoping (per-track vs. global) and authoring (professor-driven vs. anyone) changes.

## Capabilities

### New Capabilities

- `lesson-track-authoring`: a professor creates, edits, reorders, and publishes/unpublishes a lesson track, adding existing problems as ordered lesson entries with the same requirement/theme fields lessons already support.

### Modified Capabilities

- `learning-roadmap`: the roadmap is scoped to a track (browse published tracks, view one track's lessons in that track's order) instead of a single global lesson list; lesson creation/ordering is professor-driven rather than open to any user.

Note: `lesson-requirements` (locking/rewards computation) is unaffected — its requirements are already stated per-lesson-entry and don't reference global scope, so no delta spec is needed there; only the schema underneath it changes.

## Impact

- **`web/drizzle/schemas/lessons.ts`**: new `lessonTrack` table (mirrors `contest`'s `createdBy`/timestamps shape); `lesson.problemId` uniqueness dropped, `lesson.trackId` FK added, `order` becomes scoped to `(trackId)` instead of global.
- **`web/lib/actions/lessons/`**: `createLesson` gated to track ownership (mirrors `problemValidation`'s "non-owner cannot trigger" pattern already established); `getRoadmap` becomes `getTrack(trackId)` plus a new track-listing action; new track CRUD actions.
- **Migration**: existing `lesson` rows need a backfilled default `lessonTrack` row to attach to, preserving today's single-roadmap behavior for current users until professors start splitting into their own tracks.
- **Unblocks**: solution-constraint-enforcement's per-lesson-exercise constraint scope (parked change) — once a problem can back multiple lesson entries, constraints can attach to `lesson` rather than `problem` as that change's design intended.

## Revision (post-manual-testing pivot)

After manual testing of the first pass, the direction changed further based on live feedback — this section documents what actually shipped, superseding the theme/skill parts of "What Changes" and "Capabilities" above:

- **Themes, skill-locking, and rewards are dropped entirely**, not just rescoped. `lessonTheme`, `lessonThemeRequirement`, `lessonLanguageRequirement`, `userThemeSkill`, `userLanguageSkill` tables are dropped (migration, not just deprecated). A track is now a flat, numbered list of exercises — no grouping, no gating, no `locked` state.
- **New `classroom` + `classroomMembership` entities**: a track (renamed in UI copy to "assignment") belongs to exactly one class, not directly to a professor. A class has a short join code; students join a class via a shareable `/classes/join/[code]` link, mirroring `contest`'s owner-creates/anyone-joins pattern but with a code instead of an open request queue. Track visibility (`isPublished`) and browsing are now class-scoped, not globally public.
- **`lessonTrack` gains `dueDate`** (nullable timestamp), shown on the assignment page.
- **Judge auto-grading is untouched** (still `PENDING/RUNNING/PASSED/FAILED/ERROR` via the existing pipeline), but passing the judge is no longer what marks an exercise done. A new explicit **"mark done & send to professor"** action (`markLessonDone`) lets a student pick one of their own submissions (any judge status) to send; `lessonCompletion` now stores which `submissionId` was sent instead of being an automatic skill-reward trigger.
- **New professor review page** (`/roadmap/[trackId]/review`): every class member × every exercise, showing the sent submission (or "not sent") — the professor's answer-key/grading view.
- Exercise navigation gained a **previous** button alongside the existing next button.
- `user`-profile skill badges (theme/language skill display) removed along with the dropped skill tables.
