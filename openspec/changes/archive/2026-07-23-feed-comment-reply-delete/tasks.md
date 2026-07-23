## 1. Schema

- [x] 1.1 Add nullable `parentId` self-reference column (`onDelete: "cascade"`) to `activityComment` in `web/drizzle/schemas/activities.ts`, plus a `replies`/`parent` relation
- [x] 1.2 Run `bun db:generate` to create the migration, then `bun db:push` (or `bun db:migrate`) locally

## 2. Server actions

- [x] 2.1 Add `web/lib/actions/activity/delete-activity.ts`: `deleteActivity(activityId)` — verify `getCurrentUser()` matches `activityFeed.userId`, throw on mismatch, `db.delete(activityFeed).where(eq(id, activityId))`
- [x] 2.2 Update `addActivityComment` in `web/lib/actions/activity/add-comment.ts` to accept optional `parentId`; when present, look up the parent comment and throw if `parent.parentId` is not null (no replies-to-replies)
- [x] 2.3 Update `getActivityEngagement` in `web/lib/actions/activity/get-activity-engagement.ts` to group each activity's comments into top-level comments with a nested `replies: ActivityComment[]` array (comments where `parentId` is set attach to their parent; drop replies whose parent is missing)

## 3. Hooks

- [x] 3.1 Add `useDeleteActivity` mutation in an appropriate hook file (e.g. `web/hooks/use-activity-like.tsx` or a new `use-activity.tsx`), invalidating feed/engagement queries on success
- [x] 3.2 Update `useAddActivityComment` in `web/hooks/use-activity-comments.tsx` to accept an optional `parentId` argument
- [x] 3.3 Add `useDeleteActivityComment` mutation wired to `deleteActivityComment`, invalidating the relevant engagement query on success (already existed)

## 4. UI — activity-card

- [x] 4.1 Add a 3-dot `DropdownMenu` (top-right of the card) with a "Delete" item, rendered only when `activity.user?.id === currentUser?.id`; on confirm, call `useDeleteActivity`
- [x] 4.2 Render top-level comments with a delete (trash icon) button next to each, shown only when `comment.user?.id === currentUser?.id`, calling `useDeleteActivityComment`
- [x] 4.3 Add a "Reply" text control under each top-level comment that toggles an inline reply input; submitting calls `useAddActivityComment` with the parent's id
- [x] 4.4 Render each top-level comment's `replies` nested/indented beneath it, each with its own author-scoped delete button (no "Reply" control on replies)

## 5. i18n & verification

- [x] 5.1 Add new translation keys (delete, reply, confirm-delete prompts) to `web/messages/en.json` and `web/messages/br.json` under `UserPage.Feed`
- [x] 5.2 Run `bun lint` in `web/`
- [ ] 5.3 Manually verify in the running app: delete own activity item, delete own comment, reply to a comment, confirm delete/reply controls are hidden for other users' items/comments, confirm replying to a reply is not offered in the UI
