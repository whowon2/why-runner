## Why

WhyRunner has pivoted from a competitive/social coding platform to an educational platform (teacher/student classes, lessons, grading). The `/feed` page, follower/following relationships, and activity-item likes/comments were built for a social/competitive audience and no longer fit the product direction. They add surface area (pages, notifications, DB tables) with no role in the classroom workflow.

## What Changes

- **BREAKING**: Remove the `/feed` page (Following/Explore tabs, infinite scroll) entirely.
- **BREAKING**: Remove follow/unfollow — the `FollowButton`, `/user/[username]/followers` and `/user/[username]/following` pages, and the `userFollow` DB table.
- **BREAKING**: Remove activity-item engagement (likes, comments, replies) — `ActivityCard`'s like/comment UI, `activityLike` and `activityComment` DB tables, and their server actions/hooks.
- **BREAKING**: Remove the profile's "Activity Feed" tab (`app/[locale]/user/_components/feed.tsx`) since it renders the same `activityFeed` items with the same engagement UI being removed.
- **BREAKING**: Remove the `activityFeed` table and its writers (contest/problem publish no longer create feed events).
- **BREAKING**: Remove `FOLLOW`, `ACTIVITY_LIKE`, `ACTIVITY_COMMENT`, and `FOLLOWED_USER_PUBLISHED_PROBLEM` from the notification system — drop the notification types, their aggregation logic, and their inbox rendering.
- Remove feed/follow entry points from navigation: `user-dock.tsx`, profile `tabs.tsx`, and any other links into `/feed` or the followers/following pages.
- Drizzle migration dropping `activity_feed`, `activity_like`, `activity_comment`, `user_follow` tables and the removed notification enum values.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `notifications`: Remove the `FOLLOW`, `ACTIVITY_LIKE`, `ACTIVITY_COMMENT`, and `FOLLOWED_USER_PUBLISHED_PROBLEM` notification types and all requirements/scenarios describing them; the inbox no longer surfaces social notifications.
- `profile-fetch-layout`: The "Posts" tab (backed by `activityFeed`) is removed, leaving "Contests" and "Problems" as the profile's two tabs; the "Posts tab" requirement is dropped and the tabs requirement updated accordingly.
- `problem-lifecycle`: Publish no longer creates an `activityFeed` entry; drop that clause from the publish-validation requirement and scenarios.
- `contest-lifecycle`: Publish no longer creates an `activityFeed` entry; drop that clause from the publish-validation requirement and scenarios.
- `query-cache-invalidation`: Remove the follow/unfollow cache-invalidation requirement (no more followers/following lists to invalidate).
- `notification-preferences`: The settings notification-type module list drops "Social" and "Problems" groups (their types no longer exist).

### Removed Capabilities
<!-- these existing specs are deleted outright, not just modified -->
- `social-feed`: the `/feed` page and its Following/Explore behavior are removed.
- `user-follow`: follow/unfollow relationships and the followers/following list pages are removed.
- `activity-engagement`: likes/comments on activity feed items are removed along with the feed itself.

## Impact

- **DB schema**: `drizzle/schemas/activities.ts` (activityFeed, activityLike, activityComment tables) dropped; `userFollow` table in `drizzle/schemas/users.ts` dropped; `notifications.ts` enum shrinks. New migration via `bun db:generate`.
- **Server actions**: `lib/actions/activity/*` (get-feed, get-activity-engagement, add-comment, delete-comment, delete-activity) and `lib/actions/follow/*` (toggle-follow, get-follow-state, get-follow-list) deleted. Any contest/problem "publish" action that currently inserts an `activityFeed` row loses that side effect.
- **Hooks**: `hooks/use-feed.tsx`, `use-follow.tsx`, `use-follow-list.tsx`, `use-activity-like.tsx`, `use-activity-comments.tsx` deleted.
- **Components**: `components/activity-card.tsx`, `follow-button.tsx`, `follow-list.tsx`, `follow-tabs.tsx` deleted.
- **Pages**: `app/[locale]/feed/**`, `app/[locale]/user/[username]/followers/**`, `app/[locale]/user/[username]/following/**`, `app/[locale]/user/_components/feed.tsx` deleted; profile `tabs.tsx` and `user-dock.tsx` updated to drop entry points.
- **Notifications**: `components/notifications/notification-bell.tsx` and inbox rendering lose the FOLLOW/ACTIVITY_LIKE/ACTIVITY_COMMENT/FOLLOWED_USER_PUBLISHED_PROBLEM cases.
- **i18n**: `messages/*.json` `SocialFeed`, `UserPage.Feed`, and related follow/notification strings become unused (pruned as part of cleanup, not required for correctness).
