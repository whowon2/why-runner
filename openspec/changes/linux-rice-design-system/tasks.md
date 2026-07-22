## 1. Typography

- [x] 1.1 Import `Geist_Mono` from `next/font/google` in `web/app/[locale]/layout.tsx`, configure `variable: "--font-geist-mono"`, apply the variable className to `<html>` or `<body>`
- [x] 1.2 In `web/app/globals.css`, point `@theme`'s `--font-sans` at `var(--font-geist-mono)` (keep `ui-monospace`/`monospace` fallbacks instead of the old sans-serif fallback stack)
- [ ] 1.3 Visually sweep home, problems list, problem workspace, profile, and contest pages for monospace-caused overflow/truncation/width regressions and fix any that appear

## 2. Radius & Elevation Tokens

- [x] 2.1 Set `--radius: 0rem` in `:root` in `web/app/globals.css`
- [x] 2.2 Audit `web/components/ui/*` for hardcoded `shadow-*` classes on card/dialog/popover/dropdown-menu/select primitives and replace with `border` (using the existing `--border` token) instead
- [x] 2.3 Audit `web/components/ui/*` and page-level components for hardcoded `rounded-*` classes that bypass the `--radius-*` variables, and remove them so the zero-radius token takes effect everywhere

## 3. Color Palette

- [x] 3.1 Retune `:root` OKLCH tokens in `web/app/globals.css` toward a flat near-white background with a single accent hue reused for `--primary`/`--secondary`/`--ring`
- [x] 3.2 Retune `.dark` OKLCH tokens toward a flat near-black background using the same accent hue (adjusted lightness/chroma only)
- [x] 3.3 Verify `--destructive`, `--border`, `--input` still provide sufficient contrast against the new backgrounds in both modes

## 4. Remove Decorative Gradients

- [x] 4.1 Delete the `moveHorizontal`, `moveVertical`, `moveInCircle` `@keyframes` blocks and their `--animate-first`..`--animate-fifth` variables from `web/app/globals.css` (confirmed unused by any component via repo-wide grep)

## 5. Page Layout Consistency

- [x] 5.1 Create a shared list-page header component (e.g. `web/components/list-page-header.tsx`) modeled on `web/app/[locale]/contests/_components/list.tsx`'s existing header block: icon badge, title, subtitle, primary action button, search input, filter control
- [x] 5.2 Update `web/app/[locale]/problems/_components/list.tsx` to use the shared header component (add icon badge + subtitle it currently lacks) instead of its bare `<h1>` + button + search/filter markup
- [x] 5.3 Update `web/app/[locale]/contests/_components/list.tsx` to consume the same shared header component instead of its inline header JSX
- [x] 5.4 Change top-level container widths to `max-w-5xl` on `web/app/[locale]/page.tsx`, `web/app/[locale]/user/page.tsx`, `web/app/[locale]/roadmap/page.tsx`, and `web/app/[locale]/problems/_components/list.tsx` (currently `max-w-4xl`/`max-w-6xl`/`max-w-7xl`); leave `web/app/[locale]/contests/_components/list.tsx` as-is since it's already `max-w-5xl`

## 6. Verification

- [x] 6.1 Run `bun lint` in `web/` (pre-existing unrelated lint errors in untouched files; all files touched by this change are clean)
- [ ] 6.2 Start `bun dev` and manually check light mode, dark mode, and a Dialog/Popover/Card-heavy page (e.g. problem workspace) for correct font, sharp corners, and bordered elevation — dev server confirmed running and pages compile/respond correctly, but visual review needs a human/browser check
- [ ] 6.3 Manually check `/problems` and `/contests` render the identical shared header pattern, and that all top-level pages share the same container width — same caveat as 6.2
