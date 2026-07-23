## Why

Social-feed work copied Davar's feed layout but skipped its interaction affordances: users can't delete their own activity items, can't delete their own comments from the UI (the server action exists but nothing calls it), and can't reply to a comment. The reference screenshots show a 3-dot menu with "Excluir" on posts and a "Responder"/delete affordance on each comment — none of that exists here.

## What Changes

- Add a 3-dot ("...") menu on each activity card, visible to the item's author, with a "Delete" action that removes the activity feed item (and its likes/comments via cascade).
- Add a delete action (trash icon) next to each comment, visible only to that comment's author, wired to the existing `deleteActivityComment` server action.
- Add comment replies: a "Reply" affordance under each top-level comment that opens an inline input; replies render nested under their parent comment.
- **BREAKING**: `activityComment` table gains a `parentId` self-reference column; `getActivityEngagement`'s returned `comments` shape changes from a flat list to top-level comments with a nested `replies` array.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `activity-engagement`: adds delete-own-activity-item, delete-own-comment (UI), and reply-to-comment requirements.

## Impact

- `web/drizzle/schemas/activities.ts` — new `parentId` column + self-relation on `activityComment`, migration.
- `web/lib/actions/activity/` — new `delete-activity.ts`; `add-comment.ts` accepts optional `parentId`; `get-activity-engagement.ts` groups comments into top-level + replies.
- `web/hooks/use-activity-comments.tsx`, `web/hooks/use-activity-like.tsx` (or wherever engagement queries live) — new delete-activity mutation, reply mutation, cache invalidation.
- `web/components/activity-card.tsx` — 3-dot menu, per-comment delete button, reply input/thread rendering.
