---
name: mutation-cache-invalidation
description: Use whenever creating or editing a React Query mutation hook (web/hooks/use-*.tsx) in this repo. Ensures every mutation invalidates all queries whose data it affects, so no view goes stale after create/update/delete/publish/follow/etc actions.
metadata:
  type: process
---

Every mutation hook that changes server state MUST invalidate every cached query whose data it affects, inside the hook itself (not left to the calling component).

## Checklist when writing/editing a mutation hook

1. Identify every query key touched by this mutation's effect, not just the "obvious" one:
   - The list query for the entity (e.g. `["contests"]`, `["problems"]`)
   - The single-entity query (e.g. `["contest", id]`)
   - Any related/derived query (participants, followers/following, submissions scoped by problem AND by contest, activity feed, profile header, etc.)
2. Add `useQueryClient()` to the hook and call `queryClient.invalidateQueries({ queryKey: [...] })` in `onSuccess`, for each affected key. Use the shortest key prefix that covers all param variants (e.g. `["contests"]` invalidates `["contests", params]` too — no need to enumerate params).
3. Put invalidation in the mutation hook itself, not in the calling component's `onSuccess`. This guarantees it fires for every caller of the hook, not just the one that happened to be written carefully.
4. Cover both sides of relational data: if the mutation affects a child (e.g. a submission scoped to a problem within a contest), invalidate both the problem-scoped and contest-scoped queries.
5. Before considering the task done, grep for every `useQuery` in the codebase whose data could plausibly change from this mutation, and confirm each one is covered.

## Reference

This repo already follows this pattern (see commit `29fd83e`, "fix: invalidate stale query caches after contest/follow mutations") and it is codified as an explicit spec at `openspec/specs/query-cache-invalidation/spec.md` — check that file for the list of flows already covered, and add a new requirement there (via an OpenSpec change) when you add invalidation for a new mutation flow.

## Common miss

A mutation hook with no `onSuccess` at all, or an `onSuccess` that only shows a toast/navigates but never touches `queryClient`, is the most common failure mode found in this repo (e.g. `useDeleteContest` before this was caught).
