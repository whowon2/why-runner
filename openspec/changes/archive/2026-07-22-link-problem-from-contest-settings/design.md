## Context

The attached-problems list in `EditContestProblems` (`web/app/[locale]/contests/_components/tabs/settings/problems.tsx`) renders each problem's code/title as plain `<span>`/`<p>` text. The global problem list (`web/app/[locale]/problems/_components/list.tsx`) already links to `/problems/${slug}` (with `?tab=edit` when the viewer owns the problem). This is a small, single-file UI change — no new architectural pattern, dependency, or data model change — so this design doc is kept minimal.

## Goals / Non-Goals

**Goals:**
- Make the code/title portion of each attached-problem row a link to `/problems/${probOnCont.problem.slug}`.
- Keep it visually consistent with the existing "by {creator}" link already in that row.

**Non-Goals:**
- Changing reorder/remove button behavior.
- Adding an edit-mode variant of the link (unlike the global list, this row doesn't know if the viewer owns the problem).

## Decisions

- Link only the code+title span, not the whole row, so the reorder/remove buttons remain distinct click targets — consistent with how the "by {creator}" link is already scoped to just that text.
- Always link to the plain view route (`/problems/${slug}`), not the `?tab=edit` variant used in the global list for owned problems — Settings doesn't have ownership context readily available here, and plain view is a safe default that still lets the creator navigate to the problem's own edit affordances if they own it.

## Risks / Trade-offs

- [Slug missing/stale for a legacy row] → `ProblemPreview`/`problem` relation already guarantees `slug` is populated (used identically by the global list); no new risk introduced.
