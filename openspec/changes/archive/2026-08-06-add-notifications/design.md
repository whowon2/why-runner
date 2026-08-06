## Context

WhyRunner's web app (`web/`) is a Next.js server-actions app on Postgres/Drizzle; grading happens in a separate Rust service (`judge/`) that writes results directly to the shared `submission` table via its own DB connection — the web process is not in that write path and cannot simply "call a function" when a submission finishes. Every other event this change cares about (follow, activity like/comment, contest join lifecycle, problem publish, lesson unlock) already flows through a `web/lib/actions/**/*.ts` server action we can hook directly.

`davar` (`../davar`) already ships this exact pattern for a social app: a single `notification` row type with `actorIds`/`count` aggregation, a `NotificationMute` per-content override, REST routes under `/api/notifications`, and a bell component polling unread count every 30s. We're reusing its data-model shape, not its stack (davar is Prisma; we're Drizzle + server actions, no REST routes needed since everything else in this app goes through server actions called from React Query hooks).

## Goals / Non-Goals

**Goals:**
- One `notification` table covering all module events listed in the proposal, with per-type aggregation behavior (LIKE/FOLLOW aggregate; everything else is one row per event).
- A `notification_preference` table that defaults every type to enabled for every user, with no backfill migration needed for new types added later (absence of a row == enabled).
- Reliable delivery for `SUBMISSION_GRADED` despite judge writing to Postgres outside the web app's process.
- Bell UI + settings section consistent with the existing app shell and `/settings` page conventions.

**Non-Goals:**
- Real-time push (WebSocket/SSE). Polling unread count, matching `davar`'s 30s interval, is sufficient here.
- Email/push notifications — in-app only, matching the proposal.
- Changing judge's (Rust) schema or write path. `judge/CLAUDE.md` explicitly keeps `judge` and `web` schema-independent aside from hand-synced enums; this change must not add a new coupling there.
- Per-content mute (davar's `NotificationMute` on a specific study/post) — out of scope; preference toggles are per-type, not per-content-item, since the proposal only asked for "what kind of notification," not per-item muting.

## Decisions

### 1. `SUBMISSION_GRADED` is created by a Postgres trigger, not application code
Judge writes `submission.status` transitions (`PENDING → RUNNING → PASSED|FAILED|ERROR`) directly to Postgres from a separate Rust process the web app doesn't control or observe in real time. Adding an application-level listener would mean either (a) judge learning about the `notification` schema — rejected, violates the existing "judge and web don't share a schema source" boundary — or (b) web polling `submission` for status changes to backfill notifications, which is extra infra for a race-prone job.

Instead: an `AFTER UPDATE OF status ON submission` trigger function (SQL, shipped as a Drizzle migration) inserts a `notification` row directly when `status` transitions into `PASSED`, `FAILED`, or `ERROR` (and only if the recipient hasn't disabled `SUBMISSION_GRADED` in `notification_preference` — checked in the trigger function itself via an `EXISTS`/`NOT EXISTS` subquery). This keeps the coupling at the DB level, which both services already share, instead of forcing either service to know about the other's write path.

Alternative considered: web-side `pg_notify('new_submission', ...)`-style LISTEN. Rejected — judge is what fires that particular channel to claim work; piggybacking a second consumer on it doesn't fit (that channel means "new work available," not "work finished") and would require a permanently-running LISTEN client in the Next.js process, which doesn't otherwise exist.

### 2. Aggregation model matches davar: `count` + `actorIds[]`, scoped to unread rows
`FOLLOW` and `ACTIVITY_LIKE` reuse davar's pattern — find an existing *unread* notification of that type (and, for `ACTIVITY_LIKE`, same `activityId`) for the recipient; increment `count` and append to `actorIds` (capped, e.g. last 5) instead of creating a new row. All other types (`ACTIVITY_COMMENT`, `CONTEST_JOIN_REQUEST`, `CONTEST_JOIN_APPROVED`, `CONTEST_JOIN_REJECTED`, `SUBMISSION_GRADED`, `FOLLOWED_USER_PUBLISHED_PROBLEM`, `LESSON_UNLOCKED`) always insert a fresh row — these are either singular by nature (a submission only grades once) or a user genuinely wants to see each one (each comment, each join request).

### 3. Preferences are opt-out, not opt-in, with no-row-means-enabled semantics
`notification_preference(userId, type, enabled)` only stores rows for types a user has explicitly turned **off**. "By default show all" means: no row for a `(userId, type)` pair implies enabled. This avoids a data migration/seed step every time a new notification type ships — new types are automatically on for all existing users. `notify*()` helpers check `NOT EXISTS (... enabled = false)` before creating a row.

### 4. One `notify*` helper per event type, called from existing server actions (except submission grading)
Mirrors `davar/src/lib/notifications.ts` — small, single-purpose functions (`notifyFollow`, `notifyActivityLike`, `notifyActivityComment`, `notifyContestJoinRequest`, `notifyContestJoinApproved`, `notifyContestJoinRejected`, `notifyFollowedUserPublishedProblem`, `notifyLessonUnlocked`) in `web/lib/notifications.ts`, each wrapped in try/catch so a notification failure never breaks the underlying action (follow/like/join/etc. must still succeed even if notification insert fails). Called at the end of the relevant server action after the primary mutation commits.

### 5. Inbox/preferences exposed as server actions, not REST routes
Unlike davar (Next.js API routes), this app's convention (per `web/CLAUDE.md`) is server actions + React Query hooks with no REST layer beyond auth. `lib/actions/notifications/{list,unread-count,mark-read,mark-all-read,get-preferences,update-preference}.ts`, each wrapped by a `hooks/use-*` hook, matches every other feature in this codebase.

### 6. Settings section is per-type toggles grouped by module, not a single master switch
The proposal explicitly asks for per-type selection ("select what kind of notification he wants"). The settings UI groups the ~8 types under module headings (Social, Contests, Submissions, Problems, Lessons) for scannability, but each type is its own switch — no coarser on/off. A "Select all / Select none" convenience action per group is allowed as UI sugar but every switch still maps 1:1 to a `notification_preference` row.

## Risks / Trade-offs

- **[Risk]** A SQL trigger is a second place (beyond Drizzle schema + server actions) where notification logic lives, easy to forget when reasoning about the codebase. → **Mitigation**: keep the trigger function minimal (single INSERT ... SELECT, no branching beyond the preference check), document it prominently in `web/drizzle/migrations/` and cross-link from `notifications` spec and both CLAUDE.md files if judge-facing behavior is implied.
- **[Risk]** Unread-count polling at 30s (matching davar) adds recurring load per active session. → **Mitigation**: acceptable at current scale (same trade-off davar already makes); revisit with SSE/WebSocket only if usage grows.
- **[Risk]** `LESSON_UNLOCKED` and `FOLLOWED_USER_PUBLISHED_PROBLEM` triggers depend on correctly identifying "who should be notified" (all followers of a user; all users for whom a lesson just became unlocked) — both are potentially fan-out inserts. → **Mitigation**: cap fan-out reasonably (e.g. skip `FOLLOWED_USER_PUBLISHED_PROBLEM` fan-out entirely if a publisher has very large follower counts is out of scope for now since this app has no such scale; batch-insert via `insertMany` rather than N round-trips).
- **[Risk]** Trigger-created notifications bypass the app-level try/catch safety net used for the other `notify*` helpers — a bug in the trigger could fail the judge's `UPDATE` itself. → **Mitigation**: keep the trigger function defensive (wrap body in its own exception handler that logs and swallows, never re-raises) so a notification bug can never block grading writes.

## Migration Plan

1. Add `notification` and `notification_preference` tables + enums via `bun db:generate` / migration file.
2. Add the `submission` status-transition trigger + function in the same migration (raw SQL block, since Drizzle doesn't model triggers natively).
3. Ship `notify*` helpers and wire call sites into existing server actions (additive, no behavior change to those actions' return values).
4. Ship inbox/preference server actions + hooks.
5. Ship bell UI in the app shell and the Settings > Notifications section.
6. No backfill needed — existing users get zero notification rows and all-enabled preferences by construction (empty tables at deploy time).
7. Rollback: drop the trigger and both new tables; no other schema depends on them.

## Open Questions

- Where exactly does "a new roadmap lesson becomes available" get computed today (`lesson-lock.ts`?) — needs confirming during implementation which call site owns the unlock transition so `notifyLessonUnlocked` fires exactly once per user per lesson.
- Confirm actual follower fan-out volume expectations for `FOLLOWED_USER_PUBLISHED_PROBLEM` before implementation, in case a cap/rate-limit is warranted later.
