## Why

The profile page's user-info section (name, bio, meta tags, stats) is a generic social-card layout that buries scannable facts under decorative chrome (large gradient banner, big avatar, loosely spaced rows). Terminal "fetch" tools (`fastfetch`, `onefetch`) solve the same problem — summarize an entity's key facts at a glance — with a dense two-column layout: a logo/avatar block on the left, tightly-packed `label: value` rows on the right, ending in a color-swatch strip. Adopting that layout makes the profile read as fast, information-dense reference card consistent with the project's existing linux-rice-inspired design system, instead of a social-network-style header.

## What Changes

- Replace the banner+centered-avatar+stat-cards profile layout with a two-column fetch-style layout: avatar/logo block on the left, `label: value` info rows on the right (name, bio, location, website, joined date, contests, problems, global rank, theme skills, language skills).
- Add a bottom color-swatch strip (ANSI-style block row) as a decorative footer, matching fastfetch/onefetch output.
- Remove the full-width cover image banner from the primary info card; cover image upload affordance is either dropped or relocated (decided in design.md) since it conflicts with the dense fetch layout.
- Keep existing avatar upload interaction (click-to-change), adapted to the new left-column position.
- Restyle stats (contests/problems/global rank) and skills (themes/languages) as label:value rows instead of separate stat-card and badge-cloud sections.

## Capabilities

### New Capabilities
- `profile-fetch-layout`: Defines the fastfetch/onefetch-inspired two-column info-card layout for the user profile page — logo/avatar block, label:value rows, color-swatch footer — and what user data populates each row.

### Modified Capabilities
(none — underlying data contracts for profile-media and user-skills are unchanged, only presentation)

## Impact

- Affected code: `web/app/[locale]/user/_components/profile.tsx` (primary rewrite), possibly `web/app/[locale]/user/_components/form.tsx` if cover-image editing UI moves.
- No schema, server action, or hook changes expected — same data (`useProfile`, `useUserSkills`) is consumed, only its rendering changes.
- i18n: existing `ProfilePage` message keys may need new/renamed entries for relabeled rows.
