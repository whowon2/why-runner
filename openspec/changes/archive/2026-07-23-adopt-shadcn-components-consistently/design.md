## Context

`web/components/ui/` already has `empty.tsx`, `loading-swap.tsx`, `action-button.tsx`, and `separator.tsx` installed and in use on some screens (`feed.tsx`, `my-problems.tsx`, `my-contests.tsx`, `auth/signin/page.tsx`, `user-dock.tsx`), but several other screens duplicate the same visual pattern by hand instead of reusing the primitive. No `pagination.tsx` exists yet; four screens hand-roll an identical prev/next block.

## Goals / Non-Goals

**Goals:**
- Route the identified loading, empty-state, and divider spots through the existing shared primitives with no visual regression.
- Add shadcn's `Pagination` primitive and use it (or a thin wrapper around it) to de-duplicate the four copy-pasted pagination blocks.
- Keep every touched screen's current translations, counts, and query/filter behavior unchanged — this is a presentation-layer consolidation, not a behavior change.

**Non-Goals:**
- Auditing shadcn components not already flagged in the research (Tooltip, Badge, Avatar, DropdownMenu, AlertDialog are already used correctly and out of scope).
- Introducing new design tokens or altering `design-system`'s existing visual requirements (radius, palette, typography).
- Changing pagination page-size or query logic — only the control markup is consolidated.

## Decisions

- **Pagination: add via shadcn CLI, wrap once.** The four duplicated blocks (contests list, problems list, my-contests, my-problems) share the same shape (prev/next buttons, "page X of Y", "showing A-B of C") but pull from different data hooks. Add `web/components/ui/pagination.tsx` via `npx shadcn add pagination`, then build one local wrapper (e.g. `web/components/pagination-controls.tsx`) that takes `{ page, totalPages, from, to, total, onPrev, onNext }` and renders the shared markup, so each of the 4 call sites shrinks to a single component call instead of ~30 lines of JSX. Alternative considered: use the raw shadcn `Pagination` primitive inline at each of the 4 sites — rejected because the "showing A-B of C" text and disabled-state logic would still be duplicated 4x.
- **Empty states: use `Empty` composition directly at each call site**, matching the existing usage in `feed.tsx`/`my-problems.tsx`/`my-contests.tsx` (no new wrapper), since the icon/title/description content differs per screen and the existing composition API is already the established convention.
- **Loading: prefer `LoadingSwap` inside existing buttons** (already imported by `ActionButton`) over introducing a new spinner component. For `problems/_components/list.tsx`'s full-list loading state, replace the centered `Loader` with `Skeleton` row placeholders (matching the row shape used once loaded) rather than `LoadingSwap`, since it's a page-section loading state, not a button.
- **Dividers: swap `border-t` for `<Separator />` only where it's a standalone visual divider** (not a border that's also carrying layout/spacing roles like a card outline), to avoid accidentally changing element box behavior.

## Risks / Trade-offs

- [Swapping `border-t` for `Separator` could subtly change spacing since `Separator` renders its own element rather than a border on an existing element] → verify each of the 8 divider sites visually (light + dark) after the change; keep the same surrounding margin/padding classes.
- [New `pagination-controls.tsx` wrapper could become a leaky abstraction if the 4 call sites' data shapes diverge further] → keep the wrapper's prop surface minimal (page/totalPages/from/to/total/callbacks only); if a site needs something extra, pass it as children/slot rather than growing the prop list.
- [`Empty` composition swap could regress the "clear search" action button in `contests/_components/list.tsx`] → keep the existing button as `EmptyContent` children rather than dropping it.

## Migration Plan

Straightforward in-place JSX edits per file, no data/schema migration. Order: (1) add `Pagination` via shadcn CLI and build the wrapper, (2) swap the 4 pagination sites, (3) swap the 5 empty-state sites, (4) swap the 6 loading sites, (5) swap the 8 divider sites. Verify each group in the browser (light + dark) before moving to the next. No rollback concerns beyond reverting the commit(s).

## Open Questions

- None outstanding — all identified sites and target primitives are confirmed to already exist in `web/components/ui/` except `Pagination`, which is a standard shadcn CLI add.
