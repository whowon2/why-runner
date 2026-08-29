## Context

WhyRunner started as a competitive/social judged platform and grew a social layer on top: an activity feed (`activityFeed`), follow relationships (`userFollow`), and per-item engagement (`activityLike`, `activityComment`), plus four notification types tied to that layer. The product has pivoted to a teacher/student educational platform (classes, lessons, per-exercise grading). The social layer has no role in that workflow and is pure removal — no replacement feature needed.

`web` and `judge` share only submission-related schema; none of the tables being removed here are touched by `judge`, so this change is `web`-only.

## Goals / Non-Goals

**Goals:**
- Delete the `/feed` page, follow/unfollow, followers/following pages, and activity-item likes/comments end to end (UI, actions, hooks, schema).
- Keep `problem`/`contest` publish flows working after removing their `activityFeed` write.
- Keep the notification system working for the remaining (non-social) types.
- Leave the profile page functional with two tabs (Contests, Problems) instead of three.
- Ship one Drizzle migration that drops the now-unused tables/enum values cleanly.

**Non-Goals:**
- No replacement "activity log" or admin audit trail — this is a straight removal, not a redesign.
- Not touching submission, lesson, or contest-membership notification types.
- Not pruning unused i18n message keys as part of this change (dead keys are harmless; can be swept later).

## Decisions

- **Drop tables, don't soft-deprecate.** `activityFeed`, `activityLike`, `activityComment`, `userFollow` are deleted outright via migration rather than left unused, since there's no plan to revive social features and dead tables would confuse future schema readers. Alternative considered: leave tables in place, only remove UI/actions — rejected because `judge/src/models.rs` sync notes in the root CLAUDE.md make it clear schema drift is already a manual-sync pain point; fewer tables is strictly better.
- **Notification enum values removed, not just unused.** `FOLLOW`, `ACTIVITY_LIKE`, `ACTIVITY_COMMENT`, `FOLLOWED_USER_PUBLISHED_PROBLEM` are dropped from the Postgres enum. This requires any existing notification rows of those types to be deleted first (enum value removal fails if rows reference it) — migration includes a `DELETE FROM notification WHERE type IN (...)` before altering the enum.
- **Publish actions lose their `activityFeed` insert but keep everything else.** `problem-lifecycle` and `contest-lifecycle` publish validation is otherwise untouched (still requires title/dates/test cases etc.) — only the feed-entry side effect and its "no share dialog" scenario are dropped.
- **Profile drops to two tabs (Contests, Problems).** The "Posts" tab was literally `activityFeed` items for that user; with the table gone there's nothing to render. `profile-fetch-layout`'s "Profile tabs are Posts, Contests, Problems" and "Posts tab renders as a scoped section..." requirements are modified/removed accordingly; its fact-row/cover-image requirements are untouched.
- **Follower/following counts removed from the info card**, not just the list pages — since the underlying `userFollow` table is gone, there's no count to show.

## Risks / Trade-offs

- [Existing notification rows of removed types become orphaned before the enum can drop them] → Migration explicitly deletes them first; this is a one-way data loss (acceptable — they're read-only inbox history for a feature being removed).
- [Any external doc/dissertation content (`overleaf/`) still describes the social feed as a feature] → Out of scope for this change; flagged in tasks as a follow-up note, not blocking.
- [Removing `userFollow` breaks any future "recommend based on who you follow" idea] → Accepted; out of scope for the educational-platform direction.

## Migration Plan

1. Remove UI/route code first (pages, components, hooks) so nothing references the actions being deleted.
2. Remove server actions (`lib/actions/activity/*`, `lib/actions/follow/*`) and their callers (publish actions' `activityFeed` insert, notification triggers for the four removed types).
3. Update Drizzle schema files (drop `activities.ts` tables, drop `userFollow` from `users.ts`, shrink notification enum in `notifications.ts`).
4. `bun db:generate` to produce the migration; hand-verify it deletes affected notification rows before the enum `ALTER TYPE ... DROP VALUE` (Drizzle may need a manual SQL tweak here — Postgres enum value drops aren't always auto-generated correctly).
5. `bun db:migrate` locally, then `bun lint`/build to confirm no dangling imports.

No rollback beyond restoring from a pre-migration DB backup — this is a destructive schema change by design (per the pivot).

## Open Questions

- Should follower/following data be exported/archived before the migration runs in production, in case it's wanted for a future "who was engaged" retrospective? (Assumed no — proceeding with straight drop unless told otherwise.)
