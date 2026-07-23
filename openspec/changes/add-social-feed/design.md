## Context

WhyRunner has `activityFeed` rows created at contest/problem publish time (`createActivity`), rendered only on a single profile's own "Activity Feed" tab (`web/app/[locale]/user/_components/feed.tsx`). There is no cross-user feed, no follow graph, and no persisted likes/comments — the like/comment/share buttons on the profile feed card are decorative (no handlers). Problem publish currently blocks on `ShareToFeedModal`, a client dialog that must be dismissed before the user is routed back to the problem; contest publish has no such step. The reference app at `$HOME/code/davar` (Next.js + Prisma + Redis) has a fuller version of this: a `Post`/`Study`/`Collection` union feed, Redis-cached feed pages, a follow graph, likes/comments/reposts, and a separate Explore page with sort tabs. WhyRunner uses Postgres/Drizzle (no Prisma, no Redis) and has no free-text "post" concept — its feed unit is `activityFeed` (contest/problem publish events), not user-authored posts. This design adapts davar's follow/like/comment/feed *shape* to WhyRunner's existing `activityFeed`-based model rather than porting davar's post system.

## Goals / Non-Goals

**Goals:**
- Add a follow graph (`userFollow`) queryable in both directions (followers/following).
- Add persisted likes and comments on `activityFeed` rows.
- Add a `/feed` page with Following/Explore tabs, each infinite-scrolling over `activityFeed`.
- Replace the blocking `ShareToFeedModal` publish step with an activity row created unconditionally at publish time, plus a non-blocking share icon shown after publish.
- Keep the profile "Activity Feed" tab scoped to one user's own activity (already true; must not regress).

**Non-Goals:**
- No free-text "post" authoring (no `PostComposer` equivalent) — out of scope for this change; `activityFeed` remains system-generated (publish events only).
- No Redis caching layer — WhyRunner has no Redis; feed queries hit Postgres directly with cursor pagination. Can be revisited later if feed load becomes a problem.
- No reposts/quote-reposts, no notifications, no link-preview embeds — davar has these, but they're not requested here.
- No changes to the judge/Rust service.

## Decisions

**Feed data source is `activityFeed`, not a new `post` table.** WhyRunner's existing social surface is entirely publish events (`CONTEST_CREATED`, `PROBLEM_CREATED`). Rather than introducing davar's separate `Post` entity and a union-type feed merging posts/studies/collections, Following/Explore both query `activityFeed` joined against `userFollow` (Following) or unfiltered (Explore). This keeps one feed model instead of two, at the cost of not supporting free-text posts — acceptable since the request is "see other people's [problem/contest] posts," which activityFeed already represents.

**New tables, cascade-deleted, following davar's shape:**
- `userFollow(followerId, followingId, createdAt)`, composite PK, both FKs to `user.id` `onDelete: cascade`, `check (followerId != followingId)` to block self-follow, index on `followingId` for follower-count/list lookups.
- `activityLike(id, userId, activityId, createdAt)`, unique `(userId, activityId)`, FK `activityId → activityFeed.id` cascade — mirrors davar's `PostLike`.
- `activityComment(id, userId, activityId, content, createdAt)`, FK cascade — mirrors davar's `PostComment`. No edit/delete in v1 (davar has these on posts, but activity items are system-generated, not user-owned, so edit/delete of a comment is a smaller, separable feature — comment *deletion by the comment's own author* is included as a scenario, full edit is not).

**No denormalized `likesCount`/`commentsCount` columns on `activityFeed` for v1.** Davar denormalizes counts on `Post` for feed-render speed. `activityFeed` doesn't have that column today and volumes are expected to be small (one row per publish event); counts are computed with a `count()` join/subquery at read time. Revisit denormalization if feed queries become slow.

**Cursor pagination via `createdAt` + `id` tiebreaker**, matching davar's `cursor`/`nextCursor` pattern in `fetchFeedPage`/`/api/feed`, implemented as a server action (`getFeed`) rather than a REST route — WhyRunner has no REST layer beyond `/api/auth`, all data access is server actions (see `web/CLAUDE.md`), so `getFeed({ scope: "following" | "explore", cursor, limit })` is a server action returning `{ items, nextCursor }`, consumed by a `useInfiniteQuery` hook, same client pattern as davar's `FeedList`.

**Publish flow: create the activity row unconditionally inside the publish server action, not client-triggered.** Today `createActivity` for `PROBLEM_CREATED` is called from the client (`publish-button.tsx`) only after the user confirms the share modal; contest publish never calls `createActivity` at all (checked: `publish-contest-shared.ts`/`publish-contest.ts` — no activity insert). This change moves activity creation into both `publish-problem` and `publish-contest` server actions so publishing always produces a feed entry, independent of any client dialog. The client then just shows a share icon/button after a successful publish mutation (copy-link + Web Share API if available), no modal, no required interaction.

**Follow button as a small self-contained client component** (`components/follow-button.tsx`) with its own `useFollow` hook (optimistic toggle, mirroring `FeedPost`'s `likeMutation` optimistic-update pattern), rendered on profile header and Explore cards. Self-follow and following-self-profile cases are rejected server-side.

## Risks / Trade-offs

- [No denormalized counts] → read-time joins are simplest to ship correctly first; if `EXPLAIN` shows feed queries are slow under realistic data, add denormalized counters with a follow-up migration (same approach davar took, just deferred).
- [Explore tab has no ranking beyond recency] → davar's Explore has recent/popular/following sort tabs; this design ships recency-only Explore to match the literal ask ("explore for him to follow other people"), avoiding scope creep into a popularity algorithm. Sort-by-popular can be added later as a non-breaking addition.
- [Moving activity creation server-side for contests] → contest publish today creates no activity row at all; adding one changes what appears in every user's existing "Activity Feed" tab (new `CONTEST_CREATED` rows going forward). This is intended (feed needs contest events too) but is a visible behavior change worth calling out — it does not affect historical data, only future publishes.
- [Removing `ShareToFeedModal`] → BREAKING per proposal; any other caller of that component must be checked before deletion (currently only `problem/_components/publish-button.tsx` imports it — contest publish never used it).

## Migration Plan

1. Add `userFollow`, `activityLike`, `activityComment` schemas + `bun db:generate` migration.
2. Add server actions (`follow/toggle-follow.ts`, `follow/get-follow-state.ts`, `activity/toggle-like.ts`, `activity/add-comment.ts`, `activity/get-feed.ts`).
3. Move activity-row creation into `publish-problem.ts`/`publish-contest.ts` (server-side), remove client-side `createActivity` call from `publish-button.tsx`.
4. Delete `ShareToFeedModal` usage from problem publish button; add share-icon component shown post-publish on both problem and contest publish buttons.
5. Build `/feed` page + tabs + `FeedList`-equivalent + `useInfiniteQuery` hook.
6. Add `FollowButton` to profile header; wire like/comment controls into existing profile "Activity Feed" cards and new Feed cards.
7. Remove `posts.tsx` stub and its unused import in `tabs.tsx` if referenced (it currently is not wired into `ProfileTabs` — confirm before deleting).
8. No rollback complexity beyond standard migration-down; no data backfill needed (new tables start empty, old activity rows remain valid without like/comment rows).

## Open Questions

- Should comment authors be able to delete their own comments in v1, or is that a fast-follow? (Design assumes delete-own is in scope since it's low cost; confirm in tasks if descoped.)
