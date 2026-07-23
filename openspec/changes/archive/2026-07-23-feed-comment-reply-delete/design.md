## Context

`activityFeed` items ("posts") and `activityComment` rows already exist and are rendered by `web/components/activity-card.tsx`. Deletion of a comment already has a server action (`deleteActivityComment`) but no UI trigger. Deletion of an activity item and comment replies have neither backend nor UI. Reference UX (Davar project screenshots): a 3-dot menu on each post with "Excluir" (delete), and per-comment "Responder" (reply) + trash-icon delete, scoped to the item's/comment's own author.

## Goals / Non-Goals

**Goals:**
- Author-only delete for activity items and comments, surfaced in the UI.
- One level of comment replies (reply-to-a-comment, not reply-to-a-reply) rendered nested under the parent.
- Keep `getActivityEngagement`'s query shape close to current (single query, grouped in memory) rather than adding N+1 queries per activity.

**Non-Goals:**
- Editing posts or comments (only delete, matching the reference screenshots).
- Multi-level (nested-nested) reply threads.
- Notifications/mentions on reply.

## Decisions

- **Reply depth = 1, enforced at the action layer, not the schema.** `activityComment.parentId` self-references `activityComment.id` with no depth constraint in SQL (Postgres self-FK can't easily cap depth). `addActivityComment` rejects a reply whose target comment already has a `parentId` (i.e., replying to a reply), returning a validation error. Simpler than a tree UI/query for a feed comment box.
  - Alternative considered: separate `activityCommentReply` table. Rejected — duplicates the comment shape (author, content, timestamps, delete rule) for no real benefit at one level of nesting.
- **Comment grouping happens in `getActivityEngagement`, not SQL.** Fetch all comments for the given `activityIds` (already done), then group into `{ ...topLevelComment, replies: [...] }` in JS. Avoids a second round-trip and keeps the existing single-query shape.
- **Activity item delete relies on existing cascade FKs.** `activityLike.activityId` and `activityComment.activityId` already have `onDelete: "cascade"`, so deleting the `activityFeed` row is a single `db.delete(activityFeed).where(eq(id, activityId))` after an ownership check — no manual cleanup needed.
- **3-dot menu and comment delete/reply controls render only when `comment.userId === currentUser.id` / `activity.user.id === currentUser.id`**, computed client-side from the already-loaded session (same pattern `showFollow` uses today) — no new authorization endpoint, the server action re-checks ownership regardless.
- **Delete controls placed via Radix `DropdownMenu`** (already a project dependency per `components/ui/`) for the 3-dot menu, matching existing UI primitive usage; comment delete stays a plain icon button (matches the reference screenshot's inline trash icon).

## Risks / Trade-offs

- [Reply-to-reply attempted via stale client state, e.g. two tabs] → Server action re-validates the target comment's `parentId` is null at write time; UI only exposes "Reply" on top-level comments so this is a defense-in-depth check, not a primary path.
- [`parentId` migration on a table with existing rows] → Column is nullable with no default needed; existing comments become implicit top-level comments (`parentId IS NULL`), no backfill required.
- [Deleting an activity item removes comments other users wrote on it] → Matches the reference product's behavior (post owner controls the post) and is called out in the proposal as **BREAKING** for API consumers of the old flat `comments` list shape.

## Migration Plan

1. Add `parentId` column + FK + index via `bun db:generate` / `bun db:push`.
2. Ship backend actions (`deleteActivity`, `parentId` support in `addActivityComment`, grouped shape in `getActivityEngagement`) — additive/shape-changing but no consumers outside `web/hooks/use-activity-comments.tsx` and `use-activity-like.tsx`, updated in the same change.
3. Ship UI (3-dot menu, comment delete, reply input) reading the new grouped shape.
4. No rollback complexity beyond reverting the change; no destructive data migration involved.

## Open Questions

None — scope is bounded by the reference screenshots (delete post, delete comment, reply comment).
