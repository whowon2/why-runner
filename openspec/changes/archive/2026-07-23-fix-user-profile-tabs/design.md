## Context

The profile page (`web/app/[locale]/user/page.tsx` for self, `web/app/[locale]/user/[username]/page.tsx` for any user) renders `Profile` (bio card, covered by `profile-fetch-layout`) followed by `ProfileTabs` (`_components/tabs.tsx`), which mounts three tab bodies: `Feed`, `MyContests`, `MyProblems`.

Investigation found the tabs' *data* is already correctly scoped by `userId` (`getActivities(userId)`, `useContests({ userId, my: true })`, `useProblems({ userId })`) — the reported "wrong information" / "not showing properly for another person" is a presentation problem, not a data leak:

- Tab labels ("Activity Feed", "Live Contests", "Algorithm Vault") don't match what's asked for (Posts/Contests/Problems) and read as flavor copy rather than functional labels.
- `Feed` (posts tab) duplicates the full `/feed` page's own chrome — a large gradient page title, subtitle, and a "you're all caught up" flame footer — which reads as if the standalone feed page rendered inside the profile, rather than a section scoped to that one user.
- `MyContests`/`MyProblems` are bespoke card grids, styled differently from the real `/contests` and `/problems` list pages, with hand-rolled `Card`-based empty states that don't distinguish owner vs. visitor.

## Goals / Non-Goals

**Goals:**
- Rename tabs to Posts / Contests / Problems, functionally and in copy.
- Make the Posts tab read as a scoped section (no duplicated page-level chrome from `/feed`).
- Restyle Contests/Problems tabs to visually and structurally match `/contests` and `/problems` (card list w/ `ContestCard`, table w/ `ProblemsList`'s column set), including pagination.
- Introduce shadcn's `Empty` component and use it for all three tabs' empty states, with copy that differs for owner vs. visitor.

**Non-Goals:**
- No change to the underlying data sources (`getActivities`, `getContests`, `getProblems`) or their filtering logic — investigation found these already scope correctly by `userId`/draft-visibility.
- No search/status/difficulty filter UI in the profile tabs — the list is already scoped to one user, so the full filter bar from the standalone list pages isn't needed; only pagination is carried over (datasets can exceed the previous 50-item cap).
- No new "posts" data model — `activityFeed` continues to double as the posts source, as it does today and as used by `ActivityCard` elsewhere.

## Decisions

**Reuse existing presentational components rather than re-deriving markup.**
- Contests tab renders `ContestCard` (from `contests/_components/card.tsx`) in the same grid/list treatment as `ContestList`, paginated client-side via the same `page`/`ITEMS_PER_PAGE` pattern, but scoped via `useContests({ userId, my: true, page, pageSize })` — no search/status controls.
- Problems tab renders the same `Table` + `ColumnDef` structure as `ProblemsList` (title+badges, solvedByCount, solved-by-me), dropping the redundant `creator` column since it's always the profile's user, scoped via `useProblems({ userId, page, pageSize })` — no search/difficulty/`my` controls (this *is* "my problems" already, per `userId`).
  - Alternative considered: extract a shared `<ContestList>`/`<ProblemsList>` component parameterized by `userId` to eliminate duplication entirely. Rejected for this change — the standalone pages carry filter/search state via `nuqs`/`useSearchParams` tied to their own route, and forcing that through a shared component adds indirection for a one-directional presentational match. Revisit as a follow-up if the two ever need to change in lockstep.
- Posts tab keeps `ActivityCard` per-item rendering (unchanged) but drops the outer title/subtitle header block and the "caught up" footer; it becomes a plain scoped list, consistent with how Contests/Problems tabs have no page-level header of their own inside the tab body (the profile page itself provides page-level framing via the bio card above).

**Add shadcn `Empty` (`components/ui/empty.tsx`) via `npx shadcn add empty`, used identically in all three tabs.**
- Each tab passes an `isOwner`-branched title/description into a shared usage of `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription` (per shadcn's empty primitive), plus an owner-only action button (create post/contest/problem) where applicable, matching how `isOwner` already gates create buttons elsewhere on this page.
- Alternative considered: keep the current hand-rolled `Card`-based empty blocks and just fork owner/visitor copy. Rejected because the user explicitly asked for the shadcn `Empty` primitive, and it's already the direction other list-empty-states in the app should move toward.

**Translation keys**: extend `UserPage.Feed` / `UserPage.MyContests` / `UserPage.MyProblems` (or rename to `UserPage.Posts`/`.Contests`/`.Problems` for clarity) message namespaces with `emptyTitleOwner`/`emptyTitleVisitor`/`emptyDescriptionOwner`/`emptyDescriptionVisitor` keys, in both `pt` and `en`.

## Risks / Trade-offs

- [Risk] Reusing `ContestCard`/table column defs outside their original route could pull in route-specific assumptions (e.g. links assuming `/contests` context). → Mitigation: verify each reused component's internal links are already absolute (`/contests/[slug]`, `/problems/[slug]`) rather than relative, which they are per current code.
- [Risk] Dropping filters/search from the profile tabs while visually matching the list pages could read as "missing features" to a user comparing them side by side. → Mitigation: proposal/design explicitly scope this to presentation parity, not feature parity; filters are unnecessary once already scoped to one user.
- [Trade-off] Not extracting a shared list component means two places to update if `ContestCard` or the problems table columns change. Accepted for now per the alternative-considered note above.

## Migration Plan

Pure frontend presentational change behind existing routes; no data migration. Ship as a single PR: add `Empty` component, update `tabs.tsx` labels, rewrite `feed.tsx`/`my-contests.tsx`/`my-problems.tsx`, add translation keys. No feature flag needed — rollback is a normal revert.
