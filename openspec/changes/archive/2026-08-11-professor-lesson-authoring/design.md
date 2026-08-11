## Context

`lesson` (`web/drizzle/schemas/lessons.ts`) is currently a flat table: one row per problem (`problemId` unique), a single global `order` integer, and `createLesson()` has no ownership check beyond "is authenticated" — any user can add to the one shared roadmap. `getRoadmap()` reads every lesson, groups by theme client-side. There's no "class" or role concept anywhere in the schema (confirmed: no `role`/`teacher`/`cohort`/`enroll` fields exist) — every existing ownership pattern in this codebase (`problem.createdBy`, `contest.createdBy`) is "any authenticated user can create one; only the creator can edit it," not a hard role system. This change follows that same convention for tracks rather than inventing a new permission model.

This also unblocks the parked `solution-constraint-enforcement` change, whose design wanted constraints on a lesson-exercise instance (so the same problem can carry different rules in different professors' tracks) — impossible today because `lesson.problemId` is unique.

## Goals / Non-Goals

**Goals:**
- A professor can own an ordered track of lesson entries, independent of other professors' tracks.
- The same problem can back lesson entries in more than one track.
- Existing lesson mechanics (theme tags, requirement locking, completion, skill rewards) keep working unchanged in semantics.
- Existing data (today's single global lesson list) keeps working for users mid-migration — no forced re-authoring.

**Non-Goals:**
- No new role/permission system (no "teacher" vs "student" account type) — ownership (`createdBy`) is the only access-control primitive, matching `problem`/`contest`.
- No class enrollment/roster system. Tracks are publish/unpublish (like `problem`'s draft/publish), visible to all users once published — not gated to a specific roster. Per-class enrollment is a plausible future need but out of scope here.
- No change to skill/requirement *semantics* — `lessonThemeRequirement`, `lessonLanguageRequirement`, `userThemeSkill`/`userLanguageSkill` computation are untouched.
- Does not itself implement solution-constraint-enforcement — only removes the schema blocker (unique `problemId`) that change needs.

## Decisions

### 1. `lessonTrack` as a new top-level owned entity, not a field on `lesson`

**Decision:** add `lessonTrack` (id, `createdBy`, title, description, `isPublished`, timestamps) mirroring `contest`'s shape, and give `lesson` a `trackId` FK. Ordering (`order` integer) becomes meaningful only within a track (`(trackId, order)`), not globally.

Alternatives considered: tagging lessons with an owner directly (no separate track entity) — rejected because "ordered sequence for a class" is itself a first-class thing a professor names, publishes, and reorders as a unit; folding that into a bare owner field on `lesson` loses the ability to have a title/description for the sequence itself and makes "list of tracks" (the new roadmap-browsing entry point) awkward to query.

### 2. Drop `lesson.problemId` uniqueness, keep `(trackId, problemId)` unconstrained

**Decision:** a track *could* in principle add the same problem twice; no new constraint enforces one-problem-per-track in v1, since nothing about the current UI or roadmap semantics requires it and adding it is trivial to layer on later if it becomes a real authoring mistake worth blocking.

### 3. Migration path for existing lessons

**Decision:** a migration creates one default `lessonTrack` (owned by a fixed system/seed user or the first professor who touches the roadmap — exact owner TBD at implementation time, see Open Questions) and backfills every existing `lesson.trackId` to it, preserving current `order` values as that track's per-track order. The old global roadmap becomes, functionally, "the default track," so existing users see no behavior change until new tracks are created.

### 4. Roadmap becomes track-scoped; a track-listing view is new surface, not a replacement for existing lesson-page routes

**Decision:** `getRoadmap()` splits into `listTracks()` (published tracks, for browsing) and `getTrack(trackId)` (today's `getRoadmap` body, scoped by `trackId`). Individual lesson pages (`get-lesson.ts`) are addressed by lesson id as today and don't need to change route shape — only the roadmap's entry point gains a track-selection step above it.

## Risks / Trade-offs

- **[Risk]** Dropping a unique constraint is a straightforward migration, but backfilling a default track and reassigning ownership retroactively touches every existing `lesson` row — needs to run as a real migration with a chosen default owner, not just a Drizzle schema push. → Mitigation: explicit migration step in tasks, tested against a copy of current data shape before applying.
- **[Risk]** No enrollment/roster model means "publish a track" makes it visible to *all* users platform-wide, not just one professor's class — this may not match the eventual "for my class" intent. → Mitigation: explicitly scoped as a Non-Goal; flagged as a likely follow-up rather than solved here, consistent with how `problem`/`contest` visibility already works (contest has `isPrivate` as precedent if this needs revisiting).
- **[Trade-off]** Keeping `createLesson`'s existing per-lesson fields (theme tags, requirements) unchanged means track authoring UI has to compose two entities (track + lesson) instead of one — accepted, since changing those fields' shape isn't needed for the stated goal and would widen the change further.

## Open Questions

- Who owns the backfilled default track for pre-existing lesson data — a designated seed/system user, or is ownership transfer to "whoever edits it first" acceptable?
- Should `contest`'s `isPrivate` pattern be pulled forward for tracks now, or genuinely deferred until a real "my class only" need shows up?
