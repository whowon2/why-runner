## Why

The profile page section below the bio card (the tab area) predates the current list-page patterns and has drifted from them. The tabs are mislabeled and mismatched to their content ("Activity Feed" / "Live Contests" / "Algorithm Vault" instead of Posts / Contests / Problems), the posts tab (`feed.tsx`) reuses the full site-wide feed page's chrome (page title, subtitle, "you're all caught up" footer) instead of reading as a scoped section of the profile, and the contests/problems tabs are hand-rolled `Card` grids with ad-hoc empty states instead of matching the real `/contests` and `/problems` list pages. None of the tabs distinguish "no items yet" copy for the profile owner vs. a visitor viewing someone else's profile.

## What Changes

- Rename the three profile tabs to **Posts**, **Contests**, **Problems** (`tabs.tsx` trigger labels and translation keys).
- Rework the **Posts** tab (`feed.tsx`) to render the user's own posts as a self-contained section (no duplicated page title/subtitle/"caught up" footer chrome copied from `/feed`), keeping the existing `getActivities(userId)` data source.
- Rework the **Contests** tab (`my-contests.tsx`) to reuse the presentation pattern from the `/contests` list page (`contests/_components/list.tsx`) — same card/row treatment, filters/pagination behavior where applicable — instead of its own bespoke grid.
- Rework the **Problems** tab (`my-problems.tsx`) to reuse the presentation pattern from the `/problems` list page (`problems/_components/list.tsx`, table-based via `@tanstack/react-table`) instead of its own bespoke grid.
- Add shadcn's `Empty` component (`components/ui/empty.tsx`, currently not installed) and use it for all three tabs' empty states, replacing the hand-rolled `Card`/`CardContent` empty blocks.
- Empty-state copy SHALL differ depending on whether the viewer is the profile owner ("You haven't posted/created anything yet — ...") or a visitor viewing someone else's profile ("This user hasn't posted/created anything yet").
- Fix/verify that all three tabs render correctly scoped data when viewing another user's profile (i.e., strictly that user's posts/contests/problems, with owner-only affordances like create/edit buttons hidden for non-owner viewers).

## Capabilities

### New Capabilities

(none — this modifies presentation/behavior of the existing profile page, not a new capability domain)

### Modified Capabilities

- `profile-fetch-layout`: the area below the info card (tabs and their content) is being redefined — new requirements for tab naming, per-tab content presentation matching list-page patterns, and owner-vs-visitor empty states.

## Impact

- `web/app/[locale]/user/_components/tabs.tsx` — tab labels/values.
- `web/app/[locale]/user/_components/feed.tsx` — remove duplicated feed-page chrome.
- `web/app/[locale]/user/_components/my-contests.tsx` — restyle to match contests list page.
- `web/app/[locale]/user/_components/my-problems.tsx` — restyle to match problems list page.
- `web/components/ui/empty.tsx` — new shadcn component to add.
- `web/messages/{pt,en}.json` (or equivalent) — updated/added translation keys for tab labels and owner/visitor empty-state copy.
- No server action or schema changes expected; existing `getActivities`, `useContests`, `useProblems` data sources are reused as-is.
