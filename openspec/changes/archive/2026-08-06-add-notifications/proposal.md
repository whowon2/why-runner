## Why

WhyRunner has no way to tell a user something happened unless they're staring at the exact page it happened on: a submission finishes grading, someone follows them, likes/comments on their activity post, requests to join their private contest, or a creator they follow publishes new content. Right now these events are silently lost or only visible via manual polling/refresh. An in-app notification system (mirroring the pattern already proven in the `davar` codebase) gives users a durable, centralized feed of "things that happened to me," with per-type opt-out so it doesn't become noise.

## What Changes

- Add a `notification` table (recipient, type, related entity refs, aggregation `count`/`actorIds`, `read` state, timestamps) and a `notificationPreference` table (per-user, per-type boolean, defaulting to enabled).
- Add server-side `notify*` helpers invoked from existing server actions/judge-writeback paths, one per event type below — never notifying the actor about their own action.
- Add notification types, grouped by module:
  - **Social** (`follow`, `activity`): `FOLLOW`, `ACTIVITY_LIKE` (aggregated), `ACTIVITY_COMMENT` (never aggregated)
  - **Contests** (`contest`): `CONTEST_JOIN_REQUEST` (to contest owner), `CONTEST_JOIN_APPROVED`, `CONTEST_JOIN_REJECTED` (to requester)
  - **Submissions** (`problems`/judge writeback): `SUBMISSION_GRADED` (your submission finished with PASSED/FAILED/ERROR)
  - **Problems** (`problems`, follow graph): `FOLLOWED_USER_PUBLISHED_PROBLEM` — a user you follow publishes a new problem
  - **Lessons** (`lessons`): `LESSON_UNLOCKED` — a new roadmap lesson becomes available to the user
  - LIKE-style aggregation (increment `count`/`actorIds` on the same unread notification) applies only to `ACTIVITY_LIKE` and `FOLLOW`; all other types create one notification per event.
- Add a notification bell (unread badge, popover list, mark-one/mark-all-as-read, click-to-navigate to the referenced entity) reused across the app shell, following the `NotificationBell` pattern in `davar`.
- Add a **Notifications** section to `/settings` (new nav entry alongside the existing Appearance section) listing every notification type grouped by module, each with an on/off toggle. All types default to **on** ("show all"). Disabling a type suppresses creation of that notification going forward (does not delete history).
- **BREAKING**: none — purely additive tables/UI.

## Capabilities

### New Capabilities
- `notifications`: notification data model, aggregation rules, creation triggers per module event, inbox/read-state API, bell UI.
- `notification-preferences`: per-user per-type opt-in/opt-out settings, default-all-on behavior, settings page section, enforcement at notification-creation time.

### Modified Capabilities
(none — no existing capability's requirements change; this change only adds new consumers/listeners on top of existing follow/activity/contest/problem/lesson/submission flows)

## Impact

- **New DB tables**: `notification`, `notification_preference` (Drizzle schema + migration in `web/drizzle/schemas/`).
- **New server actions**: `lib/actions/notifications/*` (list, unread-count, mark-read, mark-all-read, get/update preferences).
- **Modified server actions** (add `notify*` call sites, no signature/behavior changes): `follow/toggle-follow.ts`, `activity/toggle-like.ts`, `activity/add-comment.ts`, `contest/join-contest.ts`, `contest/approve-join.ts`, `contest/reject-join.ts`, `problems/publish-problem.ts` (or shared publish path), `lessons/lesson-lock.ts` (or wherever a lesson's unlocked-state transition is computed).
- **Judge writeback path**: submission status transition to `PASSED|FAILED|ERROR` needs a hook point to trigger `SUBMISSION_GRADED` — likely the polling/webhook layer that observes submission status changes on the web side (judge itself is a separate Rust service and is out of scope; web reacts to the DB row it already owns).
- **New UI**: `components/notifications/notification-bell.tsx` (or similar), new `app/[locale]/settings/_components/notifications-section.tsx`, `settings-nav.tsx` gets a second entry.
- **New hooks**: `hooks/use-notifications.ts`, `hooks/use-notification-preferences.ts` per the React Query wrapper convention.
