## Why

The attached-problems list in a contest's Settings tab shows each problem's code and title as plain text — the creator has no way to open the problem itself from that list without leaving Settings, finding it via the global problem list, and searching by code.

## What Changes

- Each attached problem row in the Settings tab's problem list becomes a link to that problem's page (`/problems/[slug]`), matching the link pattern already used on the global problem list.
- The link target stays clickable alongside the existing reorder and remove controls, without changing the reorder/remove interactions.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `contest-settings`: the attached-problems list in the "Full contest configuration form" requirement now links each row to its problem page.

## Impact

- `web/app/[locale]/contests/_components/tabs/settings/problems.tsx` — wrap the problem title/code with a `Link` to `/problems/${probOnCont.problem.slug}`.
