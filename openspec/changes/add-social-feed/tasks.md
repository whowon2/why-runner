## 1. Schema

- [x] 1.1 Add `userFollow` table (`followerId`, `followingId`, composite PK, cascade FKs, `check (followerId != followingId)`, index on `followingId`) in `web/drizzle/schemas/users.ts` (or new `follows.ts`)
- [x] 1.2 Add `activityLike` table (`id`, `userId`, `activityId`, `createdAt`, unique `(userId, activityId)`, cascade FKs) in `web/drizzle/schemas/activities.ts`
- [x] 1.3 Add `activityComment` table (`id`, `userId`, `activityId`, `content`, `createdAt`, cascade FKs) in `web/drizzle/schemas/activities.ts`
- [x] 1.4 Add Drizzle relations for the three new tables and wire into `web/drizzle/schema.ts` exports
- [x] 1.5 Run `bun db:generate` and review the generated migration; run `bun db:migrate` locally

## 2. Follow actions

- [x] 2.1 `web/lib/actions/follow/toggle-follow.ts` — follow/unfollow, rejects self-follow, idempotent
- [x] 2.2 `web/lib/actions/follow/get-follow-state.ts` — returns `{ isFollowing, followerCount, followingCount }` for a target user relative to current user
- [x] 2.3 `web/hooks/use-follow.ts` — `useMutation` wrapper with optimistic toggle (mirror `FeedPost` like-mutation pattern from davar reference)
- [x] 2.4 `components/follow-button.tsx` — reusable follow/unfollow button

## 3. Activity engagement actions

- [x] 3.1 `web/lib/actions/activity/toggle-like.ts` — like/unlike an activity item, idempotent, returns new count
- [x] 3.2 `web/lib/actions/activity/add-comment.ts` — validates non-empty content, persists comment
- [x] 3.3 `web/lib/actions/activity/delete-comment.ts` — only the comment author may delete
- [x] 3.4 `web/lib/actions/activity/get-activity-engagement.ts` — like count/state + comments for one or more activity IDs
- [x] 3.5 `web/hooks/use-activity-like.ts` and `web/hooks/use-activity-comments.ts`

## 4. Feed query + page

- [x] 4.1 `web/lib/actions/activity/get-feed.ts` — `getFeed({ scope: "following" | "explore", cursor, limit })`, cursor pagination on `(createdAt, id)`, `following` scope joins `userFollow`
- [x] 4.2 `web/hooks/use-feed.ts` — `useInfiniteQuery` wrapper
- [x] 4.3 `web/app/[locale]/feed/page.tsx` — authenticated route, redirects to signin if no session
- [x] 4.4 `web/app/[locale]/feed/_components/feed-tabs.tsx` — Following/Explore tabs (mirror `ProfileTabs` URL-synced tab pattern)
- [x] 4.5 `web/app/[locale]/feed/_components/feed-list.tsx` — infinite-scroll list rendering activity cards, empty states per tab
- [x] 4.6 Explore feed cards include `FollowButton` for the item's author
- [x] 4.7 Add "Feed" entry to primary navigation

## 5. Wire likes/comments into existing activity cards

- [x] 5.1 Update `web/app/[locale]/user/_components/feed.tsx` (profile Activity Feed tab) to use real like/comment actions instead of decorative buttons
- [x] 5.2 Extract a shared `ActivityCard` component used by both the profile Activity Feed tab and the new `/feed` page, so engagement stays consistent across both surfaces
- [x] 5.3 Confirm profile Activity Feed tab still filters strictly by profile `userId` (no regression) — add/keep test or manual check
- [x] 5.4 Add `FollowButton` + follower/following counts to the profile header (`user-follow` spec requirement, not just Explore cards)

## 6. Publish flow: server-side activity creation + share icon

- [x] 6.1 Move `activityFeed` (`PROBLEM_CREATED`) creation into `web/lib/actions/problems/publish-problem.ts` (or its shared helper), independent of client confirmation
- [x] 6.2 Add `activityFeed` (`CONTEST_CREATED`) creation into `web/lib/actions/contest/publish-contest.ts` (or shared helper) — contest publish currently creates none
- [x] 6.3 Remove `ShareToFeedModal` usage from `web/app/[locale]/problems/_components/publish-button.tsx`; delete `web/components/share-to-feed-modal.tsx` if no longer referenced anywhere
- [x] 6.4 Add `components/share-icon-button.tsx` (copy link + Web Share API fallback) shown next to the publish success state on both `problems/_components/publish-button.tsx` and `contests/_components/tabs/settings/publish-button.tsx`
- [x] 6.5 Remove now-unused client-side `createActivity` import/call from `publish-button.tsx`

## 7. Cleanup

- [x] 7.1 Delete unused `web/app/[locale]/user/_components/posts.tsx` stub (confirm unreferenced first)
- [x] 7.2 Add/prune i18n strings in `web/messages/` for Feed tabs, follow, like/comment, share icon; remove dead `ShareToFeed` strings if fully unused
- [x] 7.3 `bun lint` and `bun format`

## 8. Verification

- [ ] 8.1 Manual: publish a problem and a contest, confirm no modal appears and a share icon shows
- [ ] 8.2 Manual: follow a user, confirm their activity appears in Following tab and not before
- [ ] 8.3 Manual: like/comment on an activity item from both the profile tab and `/feed`, confirm state matches on both surfaces
- [ ] 8.4 Manual: confirm a profile's Activity Feed tab still shows only that profile owner's own activity

Note: `bun lint`, `bun format`, `tsc --noEmit`, and `bun run build` all pass clean. 8.1-8.4 need a real logged-in click-through in a browser, which this session did not perform — left unchecked for a human/QA pass.

## 9. Followers/following list pages

- [x] 9.1 `web/lib/actions/follow/get-follow-list.ts` — cursor-paginated list of followers or following for a username, accepts optional `query` param filtering by name/username (`ilike`)
- [x] 9.2 `web/hooks/use-follow-list.ts` — `useInfiniteQuery` wrapper, `query` as part of the query key so search resets pagination
- [x] 9.3 `web/app/[locale]/user/[username]/followers/page.tsx` and `.../following/page.tsx`
- [x] 9.4 `components/follow-list.tsx` — shared list rendering (mirror davar's `FollowList`) + debounced search input wired to `use-follow-list`'s `query` param
- [x] 9.5 Make follower/following counts on profile header link to these pages
