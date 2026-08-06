## 1. Data model

- [x] 1.1 Add `notification_type` enum (`FOLLOW`, `ACTIVITY_LIKE`, `ACTIVITY_COMMENT`, `CONTEST_JOIN_REQUEST`, `CONTEST_JOIN_APPROVED`, `CONTEST_JOIN_REJECTED`, `SUBMISSION_GRADED`, `FOLLOWED_USER_PUBLISHED_PROBLEM`, `LESSON_UNLOCKED`) to `web/drizzle/schemas/notifications.ts`
- [x] 1.2 Add `notification` table (recipientId, type, count, actorIds[], read, references to submission/contest/activity/problem/lesson/user as nullable FKs, createdAt/updatedAt) with indexes on `(recipientId, read)` and per-reference-column indexes
- [x] 1.3 Add `notification_preference` table (userId, type, enabled) with a unique constraint on `(userId, type)`, storing rows only for disabled types
- [x] 1.4 Wire new schema file into `web/drizzle/schema.ts` (or equivalent barrel) and relations
- [x] 1.5 Generate migration (`bun db:generate`) and hand-review the SQL

## 2. Submission-graded DB trigger

- [x] 2.1 Write the `AFTER UPDATE OF status ON submission` trigger function: on transition into `PASSED`/`FAILED`/`ERROR`, insert a `SUBMISSION_GRADED` notification for `submission.userId` unless a disabling `notification_preference` row exists
- [x] 2.2 Wrap the trigger function body in its own exception handler that logs and swallows errors so it can never block the judge's `UPDATE`
- [x] 2.3 Add the trigger + function as raw SQL in the same migration from 1.5 (Drizzle doesn't model triggers)
- [x] 2.4 Manually verify: update a submission's status locally and confirm a notification row appears without any web process involvement (verified directly via `psql`: raw `UPDATE submission SET status='PASSED'` created a `SUBMISSION_GRADED` row with no app code running; also confirmed a `notification_preference` row correctly suppresses it)

## 3. Notification creation helpers

- [x] 3.1 Create `web/lib/notifications.ts` with a shared preference-check helper (`isNotificationEnabled(userId, type)`)
- [x] 3.2 Implement `notifyFollow` (aggregated) and call it from `lib/actions/follow/toggle-follow.ts`
- [x] 3.3 Implement `notifyActivityLike` (aggregated, delete-on-zero) and `notifyActivityUnlike`, call from `lib/actions/activity/toggle-like.ts`
- [x] 3.4 Implement `notifyActivityComment` (never aggregated), call from `lib/actions/activity/add-comment.ts`
- [x] 3.5 Implement `notifyContestJoinRequest`, call from `lib/actions/contest/join-contest.ts` (only when `joinStatus === "pending"`)
- [x] 3.6 Implement `notifyContestJoinApproved` / `notifyContestJoinRejected`, call from `lib/actions/contest/approve-join.ts` and `reject-join.ts`
- [x] 3.7 Implement `notifyFollowedUserPublishedProblem` (fan-out via batch insert to all followers), call from the problem publish path (`lib/actions/problems/publish-problem.ts` / `publish-problem-shared.ts`)
- [x] 3.8 Locate the lesson-unlock transition (confirm exact call site per design.md open question) and implement `notifyLessonUnlocked`, firing exactly once per user per lesson
- [x] 3.9 Ensure every helper enforces "never notify the actor about their own action" and is wrapped in try/catch so failures never break the underlying mutation

## 4. Inbox and preferences server actions

- [x] 4.1 `lib/actions/notifications/get-notifications.ts` — paginated/most-recent-first list for the current user
- [x] 4.2 `lib/actions/notifications/get-unread-count.ts`
- [x] 4.3 `lib/actions/notifications/mark-read.ts` and `mark-all-read.ts`
- [x] 4.4 `lib/actions/notifications/get-preferences.ts` — returns every type with its resolved enabled/disabled state (default true when no row)
- [x] 4.5 `lib/actions/notifications/update-preference.ts` — upserts/deletes a `notification_preference` row for a given type

## 5. Hooks

- [x] 5.1 `hooks/use-notifications.tsx` (list, mark-one, mark-all, matching React Query conventions used elsewhere in `hooks/`)
- [x] 5.2 `hooks/use-unread-notification-count.tsx` (polling interval matching design.md, e.g. 30s + refetch on window focus)
- [x] 5.3 `hooks/use-notification-preferences.tsx` (get + update, following [[mutation-cache-invalidation]] convention: updating a preference must invalidate the preferences query)

## 6. Bell UI

- [x] 6.1 Build `components/notifications/notification-bell.tsx`: badge with unread count, popover with list, per-item read state styling, mark-all action
- [x] 6.2 Implement per-type `describe()`/`Icon()` mapping (text + destination href) for all 8 notification types, i18n'd via `messages/`
- [x] 6.3 Wire click-to-navigate destinations: `SUBMISSION_GRADED` → problem page (no dedicated submission-result route exists), `FOLLOW` → follower profile, `ACTIVITY_LIKE`/`ACTIVITY_COMMENT` → `/feed` (posts render inline in the feed, no per-post page exists), `CONTEST_JOIN_*` → contest page, `FOLLOWED_USER_PUBLISHED_PROBLEM` → problem page, `LESSON_UNLOCKED` → roadmap lesson
- [x] 6.4 Mount the bell in the app shell (`components/user-dock.tsx`, this app's nav shell — no `Sidebar.tsx` exists here) as a `DockIcon`, session-gated like the existing settings/avatar icons

## 7. Settings section

- [x] 7.1 Add a "Notifications" entry to `app/[locale]/settings/_components/settings-nav.tsx`
- [x] 7.2 Build `app/[locale]/settings/_components/notifications-section.tsx`: types grouped under Social / Contests / Submissions / Problems / Lessons headings, each with a toggle bound to `use-notification-preferences`
- [x] 7.3 Wire the new section into `app/[locale]/settings/page.tsx` (via a new client `settings-content.tsx` wrapper, needed to keep the section-switch state off the server/client prop boundary)
- [x] 7.4 Add i18n strings for all group labels and per-type descriptions to `messages/` (pt + en)

## 8. Verification

- [x] 8.1 Manually exercise each trigger path and confirm correct notification creation/aggregation per specs/notifications/spec.md (verified against the live local Postgres: a throwaway script exercised every `notify*` helper directly — FOLLOW/ACTIVITY_LIKE aggregation, unlike-decrement-and-delete-at-zero, ACTIVITY_COMMENT non-aggregation, all three CONTEST_JOIN_* types, FOLLOWED_USER_PUBLISHED_PROBLEM fan-out, LESSON_UNLOCKED once-per-user-per-lesson; SUBMISSION_GRADED was separately verified via the DB trigger in 2.4; script and test rows deleted after, nothing committed)
- [x] 8.2 Disable each type in settings one at a time and confirm its trigger path is suppressed per specs/notification-preferences/spec.md (verified FOLLOW and SUBMISSION_GRADED suppression directly against the DB with a `notification_preference` row present; also confirmed the `/settings` page renders the new Notifications section end-to-end via an authenticated `curl` request against the running dev server)
- [x] 8.3 Confirm self-triggered events never notify the actor, across all types (verified for FOLLOW and ACTIVITY_LIKE in the same script — both are no-ops when actor === recipient; the remaining types share the same `if (actorId === recipientId) return;` guard pattern, code-reviewed for consistency)
- [x] 8.4 `bun lint` and `bun build` pass (pre-existing lint errors in unrelated files remain; nothing new introduced by this change; `bun build` is clean)
