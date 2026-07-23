## Context

`web/` uses TanStack Query on the client. Mutations write data via server actions/API routes, then must call `queryClient.invalidateQueries` for every query key whose rendered data the mutation affects. There's no shared convention enforcing this — each mutation hook or call site invalidates by hand, so coverage is inconsistent. An audit (see proposal) found the invalidation logic frequently lives in the *caller* of a mutation hook rather than the hook itself, and query keys that should be related (e.g. `["submissions", string]` vs `["submissions", { contestId }]`) don't share a prefix, so React Query's default partial-key matching silently misses them.

## Goals / Non-Goals

**Goals:**
- Fix the seven confirmed missing/incomplete invalidation sites listed in the proposal so mutated data appears immediately in every view that depends on it.
- Move invalidation responsibility into the mutation hook itself wherever a hook is reused or likely to be reused, so future callers can't silently reintroduce the bug (as already happened with `use-add-problem.tsx`/`use-remove-problem.tsx`).

**Non-Goals:**
- No new caching abstraction, no query-key registry/factory, no migration to a different data-fetching library. This is a targeted bug fix, not a refactor of the caching architecture.
- Not auditing server-side revalidation (`revalidatePath`/`revalidateTag`) — scope is client-side React Query invalidation only.

## Decisions

- **Invalidate in the hook, not the caller, when the hook is (or plausibly will be) shared.** `use-add-problem.tsx`, `use-remove-problem.tsx`, and `use-create-contest.tsx` currently push invalidation onto the caller (`problems.tsx`, `create/button.tsx` + a `refetchAction` prop). Moving `onSuccess` invalidation into the hook removes a call site that can forget to invalidate, and lets `my-contests.tsx` drop its missing `refetchAction`. Alternative considered: keep invalidation at call sites and just add the missing call in `my-contests.tsx` — rejected because it doesn't fix the underlying pattern (any future caller of `useCreateContest` would still need to remember).
- **Use broad/prefix invalidation for `follow-list`, not a precise key.** `["follow-list", username, tab, query]` can't be targeted precisely from `use-follow.tsx` because it doesn't have the profile-owner's `username` or free-text `query` in scope (only the *target* user's id). Invalidating the `["follow-list"]` prefix is a small amount of over-invalidation (refetches other users' open follower lists too) but is simple and correct. Alternative considered: thread `username` through `useToggleFollow` — rejected as unnecessary coupling for a low-traffic list refetch.
- **Align the `submissions` query-key shape instead of leaving the mismatch.** `use-problem-submissions.tsx` keys on `["submissions", String(problemId)]` while `use-contest-submissions.tsx` keys on `["submissions", { contestId }]` — different second-element shapes mean neither prefix-matches the other. Rather than reshape both hooks' keys (broader blast radius, touches more call sites), `upload.tsx`'s mutation will explicitly invalidate both keys after a successful upload. Alternative considered: unify into a single `["submissions", { problemId?, contestId? }]` shape — better long-term but out of scope for this bug-fix change; noted as a possible follow-up.

## Risks / Trade-offs

- [Broad `["follow-list"]` invalidation refetches more lists than strictly necessary when a user is followed/unfollowed] → Acceptable: follow-list queries are cheap paginated reads, not a hot path, and only refetch for currently-mounted/observed queries.
- [Moving invalidation into hooks changes behavior for the one existing caller of `use-add-problem`/`use-remove-problem`/`use-create-contest`] → Low risk: the existing callers' manual invalidation becomes redundant but harmless (invalidating an already-invalidated key is a no-op); manual calls should be removed from callers as part of this change to avoid duplication/confusion, not left in place.
- [`["user-contest-status", contestId]` still has a 10s poll as a fallback] → Kept intentionally as a safety net in case future code paths change contest membership without going through the join/leave/approve mutations touched here.

## Migration Plan

Pure client-side change, no data migration. Ship as a normal PR; verify manually per the scenarios in `specs/query-cache-invalidation/spec.md` before merge. No feature flag needed — invalidation calls are additive/corrective and have no failure mode worse than the current stale-cache bug.

## Open Questions

- Should `submissions` query keys be unified to a single shape (`{ problemId?, contestId? }`) in a follow-up change to eliminate this class of key-shape mismatch bug more generally? Not decided here — flagged in proposal impact as out of scope.
