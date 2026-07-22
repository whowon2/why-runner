## 1. Layout skeleton

- [x] 1.1 Replace the cover-banner + breakout-avatar markup in `profile.tsx` with a two-column flex container: left column for avatar, right column for the fact-row list (stack to single column below `sm:`).
- [x] 1.2 Move the avatar image, upload button, hidden file input, and glow effect into the left column, sized to roughly match the height of the fact-row list instead of the current absolute-positioned breakout style.
- [x] 1.3 Remove the full-width cover image `<div>`/`<Image>` block and its change-cover button/input from `profile.tsx`.

## 2. Fact-row list

- [x] 2.1 Add a header line component/row for the user's `name`, visually distinct (larger/bold) from the fact rows below, with a horizontal rule separator underneath.
- [x] 2.2 Build a reusable `label: value` row primitive (label in accent color, value in default text, single line, truncating/wrapping only the value).
- [x] 2.3 Render bio, location, website, joined date as rows using the new primitive, each conditionally rendered only when the corresponding `data.*` field is present (no empty rows).
- [x] 2.4 Render contests, problems, and global rank as rows using the same primitive (replacing the current big-number stat bar).
- [x] 2.5 Render theme skills and language skills as two rows, each packing all of that user's skill badges/pills onto the row's value side, wrapping onto additional lines when they don't fit.

## 3. Color-swatch footer

- [x] 3.1 Add a decorative footer row of solid-color blocks (reuse existing Tailwind theme accent colors) below the fact-row list, with no data binding, matching the fastfetch/onefetch palette-strip convention.

## 4. Cover image relocation

- [x] 4.1 Add a cover-image upload field to `form.tsx` (or a new section within it) reusing the existing `useUploadProfileImage` mutation and `CropImageDialog` with `aspect={4}` / `cropShape="rect"`, so the capability isn't lost.
- [x] 4.2 Verify the existing `coverUpdated` / `changeCover` / `adjustCover` i18n keys are reused (or added to `UserForm` messages if the form namespace differs from `ProfilePage`).

## 5. Verification

- [x] 5.1 Run `bun dev` in `web/`, open `/user`, and manually verify: header, all conditional rows, skills packing/wrapping, avatar upload still works, color footer renders, and mobile-width stacking works.
- [x] 5.2 Confirm cover image can still be set from the edit form and persists (upload mutation succeeds, toast shows).
- [x] 5.3 Run `bun lint` in `web/` and fix any Biome findings introduced by the rewrite.
