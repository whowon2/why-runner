## 1. Schema

- [x] 1.1 Add `lessonTrack` table (`web/drizzle/schemas/lessons.ts`): id, `createdBy`, title, description, `isPublished`, timestamps — mirroring `contest`'s shape.
- [x] 1.2 Add `lesson.trackId` FK to `lessonTrack`; drop `lesson.problemId` unique constraint; scope `order` uniqueness (if any) to `(trackId)`.
- [x] 1.3 Write migration: create one default `lessonTrack` (owner per design's Open Questions decision), backfill every existing `lesson.trackId` to it, preserve existing `order` values as that track's order.
- [x] 1.4 Generate + apply migration (`bun db:generate`, `bun db:migrate`); verify existing lesson data intact post-migration.

## 2. Track authoring actions

- [x] 2.1 `createTrack` server action: any authenticated user, persists title/description/`createdBy`, unpublished by default.
- [x] 2.2 `updateTrack` / `publishTrack` / `unpublishTrack` server actions, scoped to `createdBy` (reject non-owners, mirroring `problemValidation`'s owner-check pattern).
- [x] 2.3 Update `createLesson` (`web/lib/actions/lessons/create-lesson.ts`) to require a `trackId`, gated to that track's owner, and to position new entries after the track's existing entries by default.
- [x] 2.4 New `reorderLessonEntry` server action, scoped to the entry's track owner.
- [x] 2.5 New `deleteLessonEntry`/remove-from-track action if not already covered by existing lesson deletion, scoped to track owner.

## 3. Roadmap query changes

- [x] 3.1 New `listTracks()` action: published tracks only (all fields needed for the browsing view).
- [x] 3.2 Rename/refactor `getRoadmap()` → `getTrack(trackId)`, scoping all queries (lessons, completions, skills) to that track's lesson entries; keep response shape (theme grouping) as before.
- [x] 3.3 Update `get-lesson.ts` to resolve "back to roadmap" / "next lesson" via the lesson entry's `trackId` instead of the global lesson list.

## 4. UI

- [x] 4.1 New track-browsing page (list published tracks).
- [x] 4.2 Track roadmap page: rename/adjust existing roadmap page to read `trackId` from route params, call `getTrack(trackId)`.
- [x] 4.3 Track authoring UI (professor-facing): publish toggle + add-problem-to-track form (problem picker + theme checkboxes) shipped. Reorder/remove-entry actions exist server-side (`reorderLessonEntry`, `deleteLessonEntry`, hooked up in `use-lesson-entry.tsx`) but have no UI control wired yet — follow-up.
- [x] 4.4 Publish/unpublish control on the track authoring view.
- [x] 4.5 Update lesson page's back/next controls to target the track-scoped roadmap route.
- [x] 4.6 Wire new/changed hooks through React Query with correct cache invalidation for track create/update/publish and lesson-entry add.

## 5. Verification

- [x] 5.1 Existing single-roadmap users see unchanged behavior post-migration — verified via migration + `bun db:seed:lessons` against local Postgres: one `Roadmap` track auto-created and published, all 8 lessons backfilled/seeded onto it, `order` preserved.
- [x] 5.2–5.5 Superseded by the section 6/7 pivot (theme/lock/reuse model dropped entirely; see below) — moot as originally scoped.

**Bugs found and fixed while implementing** (beyond the original task list, surfaced by dropping `lesson.problemId` uniqueness):
- `createLessonSubmission` looked up its lesson by `problemId`, ambiguous once a problem can back >1 lesson — now takes `lessonId` directly (`create-lesson-submission.ts`, `use-create-lesson-submission.tsx`, `lesson-detail.tsx`).
- `awardLessonCompletionIfFirstPass` used `findFirst` on `problemId`, which would award an arbitrary lesson instead of every lesson entry the problem backs — superseded by section 6 below (this whole function is removed).
- `drizzle/seed-lessons.ts` (separate manual seed script) inserted lessons without a `trackId` — updated to create a default published "Roadmap" track first.

## 6. Pivot after manual testing (see proposal.md "Revision")

Section 5's remaining items (5.2–5.5) are superseded: themes/locking/rewards no longer exist to regression-test, and track visibility is now class-scoped rather than public. What replaced them:

- [x] 6.1 Drop `lessonTheme`, `lessonThemeRequirement`, `lessonLanguageRequirement`, `userThemeSkill`, `userLanguageSkill` tables (migration `0029_cold_triton.sql`); remove all reads/writes (`lesson-lock.ts`, `award-lesson-completion.ts`, `get-user-skills.ts`, `use-user-skills.tsx` deleted; profile skill badges removed from `app/[locale]/user/_components/profile.tsx`).
- [x] 6.2 New `classroom` + `classroomMembership` schema (`drizzle/schemas/classes.ts`), short join-code generator (`lib/class-code.ts`), `lessonTrack.classroomId` FK (backfilled to one "Default Class" for pre-existing tracks) + `lessonTrack.dueDate`.
- [x] 6.3 Class actions: `createClass`, `joinClass`, `getClass`, `listMyClasses`; `assertClassMember`/`assertClassOwner` helpers reused by every track/lesson action for access control.
- [x] 6.4 Track visibility rescoped to class membership: `listClassTracks` (was `listTracks`) replaces public browsing; `getTrack`/`createTrack` gated through the owning classroom.
- [x] 6.5 `lesson_completion` repurposed to a per-exercise snapshot table, `submissionId` FK added, `language` made nullable — populated by the whole-assignment submit flow (see section 7), not a per-exercise action.
- [x] 6.6 New professor review action + page (`get-track-review.ts`, `/roadmap/[trackId]/review`, `track-review.tsx`).
- [x] 6.7 `getPreviousLesson` action + previous-lesson button alongside the existing next button (`lesson-header.tsx`).
- [x] 6.8 UI: `/classes` (browse/create/join), `/classes/[classroomId]` (roster count, join-code display for owner, track list, create-track), `/classes/join/[code]` (auto-join + redirect); track page gets a due-date field and a "share with students" button copying the class join link; `/roadmap` root now redirects to `/classes`; nav dock target updated.
- [x] 6.9 Verified end-to-end against local Postgres: migration applied cleanly with backfill (`Default Class` auto-created, existing tracks reattached), `bun db:seed:lessons` updated and re-run successfully, `bun build` + `tsc --noEmit` + `oxlint` all clean.
- [x] 6.10 Manually tested live by the user through this session: join-by-code, roster display, publish flow, due date, and the section-7 submit/review round trip below.

## 7. Whole-assignment submit (post-6 user feedback)

Feedback during manual testing: students send the whole assignment at once, not per-exercise; professor review groups by student, not by exercise.

- [x] 7.1 New `lesson_track_submission` table (userId+trackId, `submittedAt`) — migration `0030_fast_madelyne_pryor.sql`.
- [x] 7.2 `submitTrack` action: snapshots each exercise's latest submission into `lessonCompletion`, then upserts the track-submission row; replaces the removed per-lesson `markLessonDone` action.
- [x] 7.3 Assignment page: "Submit assignment" button (student-only, hidden once submitted — no resubmit), submitted-at badge; exercise "done" checkmark now means "has a PASSED submission" (progress signal, independent of submit state).
- [x] 7.4 Review page rewritten to group by student: one row per class member, expandable to all their exercise answers (code + judge status, or "no answer"), instead of one row per exercise per student.
- [x] 7.5 Lock-after-submit: `createLessonSubmission` rejects new judge submissions once the track has been submitted; exercise page swaps the editor for a "locked" notice.
- [x] 7.6 UI polish from live feedback: `PageHeader`-consistent class/track headers (was hand-rolled `<h1>`), edit-class via `Dialog` instead of inline title editing, owner excluded from roster/count, student names link to `/user/[username]`, one-way "Publish" button (was a toggle) matching `problems`/`contests`, card backgrounds fixed off `bg-muted/30` (were indistinguishable from page background), copy-to-clipboard button no longer overflows single-line code blocks.
