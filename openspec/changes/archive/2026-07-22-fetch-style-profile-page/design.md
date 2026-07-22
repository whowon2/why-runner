## Context

The current `Profile` component (`web/app/[locale]/user/_components/profile.tsx`) renders a social-network-card layout: full-width cover banner, a large centered/breakout avatar, name+bio block, a row of icon+text meta tags, a separated stats bar (contests/problems/rank as big numbers), and a badge cloud for theme/language skills.

Running `fastfetch` and `onefetch` locally against this repo shows the target pattern instead: a fixed-width logo/art block on the left, and on the right a dense, aligned `label: value` list (one fact per line, label in accent color, value in default text), terminated by a strip of solid color blocks. There is no banner, no big typography for individual stats — every fact is the same visual weight, distinguished only by its label.

The project's own design system (`design-system` spec, "linux-rice-inspired") already favors sharp corners (`rounded-none`) and monospace/terminal aesthetics elsewhere (see `problem-workspace`), so this is a stylistic continuation, not a new direction.

## Goals / Non-Goals

**Goals:**
- Rework `Profile`'s visual structure into a two-column fetch layout: fixed-width avatar/logo column (left) + label:value fact rows (right).
- Fold contests/problems/global-rank and theme/language skills into the same label:value list instead of separate stat-card and badge sections.
- Add a bottom color-swatch strip purely as decoration (no data behind it, same as fastfetch's color palette row).
- Preserve existing behavior: avatar upload-on-click, image cropping dialog, loading skeleton, redirect-when-unauthenticated.

**Non-Goals:**
- No change to data fetching (`useProfile`, `useUserSkills`, `useUploadProfileImage`) or server actions.
- No change to the profile edit form (`form.tsx`) beyond whatever is needed if cover-image editing relocates.
- Not attempting a literal terminal/monospace font change for the whole page — only structural layout (rows, alignment, color strip), matching existing site typography.

## Decisions

**Drop the cover image banner from the info card.**
fastfetch/onefetch have no banner-image concept — the left slot is a static logo or avatar, not a photo backdrop. Keeping a cover banner while adopting the fetch layout produces an inconsistent hybrid. Decision: remove the cover banner from `Profile`; if cover-image upload must be kept, move it into the profile edit form (`form.tsx`) as a background-preview setting rather than a page-level banner. Rationale: the existing `data.coverImage` field and `useUploadProfileImage("cover")` mutation stay in the data layer either way, so this is UI-only and reversible.

**Left column = avatar, not literal ASCII/logo art.**
onefetch uses language-colored ASCII logos; fastfetch uses OS logos. Neither maps to "a user." Decision: keep the user's avatar image (with existing upload-on-click affordance) in the left column, sized to roughly match the vertical extent of the info-row list (so it reads as a "logo block" the way fastfetch's art does), rather than inventing generated ASCII art.

**Info rows as a single ordered list, not grouped sections.**
Decision: one flat `label: value` list in this order — name (as header, styled like fastfetch's `user@host` line), bio (as a `Bio:` row or subtitle under the header), location, website, joined date, contests, problems, global rank, then theme skills and language skills each as one row with comma/pill-separated values (mirroring fastfetch's `Languages:` row, which packs multiple color-coded entries onto one line). This directly mirrors both tools' structure (host header line, then uniform fact rows) instead of the current mixed card/badge/stat-number layout.

**Color-swatch footer is purely decorative.**
Decision: render a static row of 8 (or 16, matching fastfetch's 8+8 normal/bright) solid-color blocks using the existing Tailwind theme accent colors, with no data binding — same as both reference tools, which always print the terminal's 16-color palette regardless of content.

## Risks / Trade-offs

[Removing the cover banner drops an existing user-facing feature (cover photo) from the main profile view] → Mitigate by relocating cover editing to the profile settings/edit form rather than deleting the upload capability outright; call this out explicitly in tasks.md so it isn't silently dropped.

[Dense label:value rows may look cramped on mobile widths compared to the current stacked card] → Reuse existing responsive patterns in the codebase (stack to single column below `sm:` breakpoint, same as the current avatar/actions row does) rather than inventing new breakpoints.

[Flattening skills into single rows may not scale well if a user has many theme/language entries] → Keep the existing wrap-capable badge/pill rendering for the values portion of those two specific rows; only the row *label* changes to match the fetch style, not the value rendering.

## Open Questions

None — the profile-media capability's upload behavior is unaffected by relocating the cover-photo entry point, so no further data-layer decisions are needed before implementation.

## Amendment (post-implementation)

User feedback during review reversed two of the decisions above:

- **Cover image is not removed from the card.** Instead of dropping it to the edit form, it renders as the card's own full-bleed background, dimmed by a new per-user `coverDim` column (default 60, 0-100), editable via a slider shown in the same crop dialog used to upload the cover. The upload control lives back on the card itself, as an icon-only camera button at the bottom-left corner, matching the avatar's icon-only button (top-right of the avatar).
- **Global rank was dropped entirely** (not just restyled) — there was no real ranking data behind it.
- **Text legibility over the cover is handled with a text-shadow/drop-shadow filter**, not a solid background panel — a fixed white-text assumption or an opaque scrim both failed on bright or light-colored covers; the shadow approach holds up regardless of the photo's brightness or the chosen dim value.
