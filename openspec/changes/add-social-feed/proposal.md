## Why

WhyRunner's only social surface today is a per-profile "Activity Feed" tab that already scopes to one user, plus a stub `Posts` component and a blocking `ShareToFeedModal` dialog shown on problem publish (contest publish has no share step at all). There is no way to discover other users' activity, no follow relationship, no likes/comments, and the publish flow interrupts the creator with a dialog instead of getting out of the way. This change adds a real social feed (following/explore), lets users follow each other, adds like/comment interactions modeled on the reference implementation at `$HOME/code/davar`, and replaces the publish-time share dialog with a non-blocking share icon.

## What Changes

- Add a `follow` relationship (`userFollow`) so users can follow/unfollow other users.
- Add `activityLike` and `activityComment` tables so `activityFeed` entries (contest/problem publish events) can be liked and commented on.
- Add a new **Feed** page (`/feed`) with two tabs:
  - **Following**: activity from users the current user follows, newest first, infinite-scroll.
  - **Explore**: activity from all users (not just follows), newest first, infinite-scroll, to help the user discover people to follow.
- Add follow/unfollow controls on user profile pages (`/user/[username]`) and in Explore feed cards.
- Wire like/comment UI into activity feed cards (profile "Activity Feed" tab and the new Feed page), backed by the new tables.
- **BREAKING**: Remove the modal-based share step (`ShareToFeedModal`) from problem publish. Publishing a contest or problem no longer shows a dialog; the existing `activityFeed` row is created automatically at publish time (as contest publish already does implicitly via `createActivity`-style events), and a share icon/button appears next to the publish confirmation so the user can optionally copy/share the link afterward, without blocking navigation.
- Confirm (no behavior change expected, but verify) that the profile "Activity Feed" tab continues to show only that profile's own activity — it already filters by `userId`, this change must not regress that.
- Remove the unused `Posts` stub component (`web/app/[locale]/user/_components/posts.tsx`), superseded by the real feed.

## Capabilities

### New Capabilities
- `social-feed`: The `/feed` page with Following/Explore tabs, infinite scroll, and empty states.
- `user-follow`: Follow/unfollow relationship between users, follow/unfollow actions, follower/following visibility.
- `activity-engagement`: Likes and comments on activity feed items (contest/problem publish events).
- `publish-share`: Non-blocking share affordance (icon/button) shown after a contest or problem is published, replacing the pre-existing share dialog.

### Modified Capabilities
- `problem-lifecycle`: Publishing a problem no longer opens `ShareToFeedModal`; the activity feed entry is created directly as part of publish, and a share icon is surfaced afterward instead.
- `contest-lifecycle`: Publishing a contest now also creates an `activityFeed` entry (`CONTEST_CREATED`) as part of the publish action, and surfaces a share icon afterward — previously contest publish created no feed entry at all.

## Impact

- **Schema** (`web/drizzle/schemas/`): new `userFollow`, `activityLike`, `activityComment` tables + Drizzle relations; migration required.
- **Server actions** (`web/lib/actions/`): new `follow/` and `activity/` (like, comment) actions; update `problems/publish-problem.ts` (or its shared helper) to stop requiring a client-driven share step.
- **Components**: new `app/[locale]/feed/` page + tabs, follow button component, like/comment controls on activity cards, share-icon component; remove `share-to-feed-modal.tsx` and `user/_components/posts.tsx`.
- **Hooks** (`web/hooks/`): new hooks for follow toggle, feed infinite query, like/comment mutations.
- **i18n** (`web/messages/`): new strings for Feed tabs, follow, like/comment, share; removal of now-dead `ShareToFeed` strings tied to the removed modal (kept if still used elsewhere, otherwise pruned).
- **No judge/Rust changes** — this is entirely within `web/`.
