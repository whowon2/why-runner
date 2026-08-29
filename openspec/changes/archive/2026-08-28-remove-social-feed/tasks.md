## 1. Pages and routes

- [x] 1.1 Delete `app/[locale]/feed/` (page.tsx, `_components/feed-list.tsx`, `_components/feed-tabs.tsx`)
- [x] 1.2 Delete `app/[locale]/user/[username]/followers/`
- [x] 1.3 Delete `app/[locale]/user/[username]/following/`
- [x] 1.4 Delete `app/[locale]/user/_components/feed.tsx` (profile "Posts" tab content)
- [x] 1.5 Update profile tab rendering to two tabs (Contests, Problems), removing the Posts tab and its content/empty-state copy
- [x] 1.6 Remove followers/following counts and links from the profile fetch-style info card (fact-row list, `profile.tsx`)

## 2. Components

- [x] 2.1 Delete `components/activity-card.tsx`
- [x] 2.2 Delete `components/follow-button.tsx`
- [x] 2.3 Delete `components/follow-list.tsx`
- [x] 2.4 Delete `components/follow-tabs.tsx`
- [x] 2.5 Remove feed/followers/following links from `components/user-dock.tsx`
- [x] 2.6 Remove FOLLOW/ACTIVITY_LIKE/ACTIVITY_COMMENT/FOLLOWED_USER_PUBLISHED_PROBLEM cases from `components/notifications/notification-bell.tsx`

## 3. Hooks

- [x] 3.1 Delete `hooks/use-feed.tsx`
- [x] 3.2 Delete `hooks/use-follow.tsx`
- [x] 3.3 Delete `hooks/use-follow-list.tsx`
- [x] 3.4 Delete `hooks/use-activity-like.tsx`
- [x] 3.5 Delete `hooks/use-activity-comments.tsx`

## 4. Server actions

- [x] 4.1 Delete `lib/actions/activity/` (get-feed.ts, get-activities.ts, get-activity-engagement.ts, add-comment.ts, delete-comment.ts, delete-activity.ts, toggle-like.ts)
- [x] 4.2 Delete `lib/actions/follow/` (toggle-follow.ts, get-follow-state.ts, get-follow-list.ts)
- [x] 4.3 Remove the `activityFeed` insert (and any related trigger) from `lib/actions/problems/publish-problem.ts`, keeping the rest of publish validation intact
- [x] 4.4 Remove the `activityFeed` insert (and any related trigger) from `lib/actions/contest/publish-contest.ts`, keeping the rest of publish validation intact
- [x] 4.5 Remove FOLLOW/ACTIVITY_LIKE/ACTIVITY_COMMENT/FOLLOWED_USER_PUBLISHED_PROBLEM notification-creation logic from `lib/notifications.ts`

## 5. Database schema and migration

- [x] 5.1 Delete `activityFeed`, `activityLike`, `activityComment` table definitions from `drizzle/schemas/activities.ts` (delete the file if nothing else remains in it)
- [x] 5.2 Delete the `userFollow` table definition from `drizzle/schemas/users.ts`
- [x] 5.3 Remove `FOLLOW`, `ACTIVITY_LIKE`, `ACTIVITY_COMMENT`, `FOLLOWED_USER_PUBLISHED_PROBLEM` from the `NotificationType` enum in `drizzle/schemas/notifications.ts`
- [x] 5.4 Run `bun db:generate`; verify the generated migration deletes existing `notification` rows of the removed types before altering the enum (adjust the SQL by hand if Drizzle doesn't order it correctly)
- [x] 5.5 Run `bun db:migrate` against local DB and confirm it applies cleanly

## 6. Cleanup and verification

- [x] 6.1 Search for and remove now-dead imports/references to deleted modules (`rg -l "activity-card\|use-feed\|use-follow\|follow-button\|follow-list\|follow-tabs"` in `web/`)
- [x] 6.2 Remove unused `SocialFeed`, `UserPage.Feed`, and follow/notification-social message keys from `web/messages/*.json`
- [x] 6.3 Run `bun lint` and fix any resulting issues
- [x] 6.4 Run `bun build` to confirm the app compiles with no dangling references
- [ ] 6.5 Manually verify: problem publish still works and profile shows only Contests/Problems tabs; contest publish still works; notification bell shows no FOLLOW/ACTIVITY_LIKE/ACTIVITY_COMMENT/FOLLOWED_USER_PUBLISHED_PROBLEM entries
