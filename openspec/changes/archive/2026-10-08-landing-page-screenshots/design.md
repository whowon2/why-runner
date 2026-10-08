## Context

`web/app/[locale]/page.tsx` is a client component. Its only product preview is a `Safari` mockup (`components/ui/safari.tsx`) pointing at `https://…vercel-storage.com/example.png`. `Safari` places media in a fixed 1200×700 viewport with `object-cover object-top`.

New screenshots in `web/assets/` (outside `public/`), each in light and dark:

| File | Size | Aspect |
| --- | --- | --- |
| `contest-problem-*` | 1410×1193 | ~1.18 |
| `problems-*` | 1580×970 | ~1.63 |
| `help-*` | 650×539 | ~1.21 (dialog) |

Dark mode is class-based (`@custom-variant dark (&:is(.dark *))` in `globals.css`), so `dark:` Tailwind variants work in SSR markup.

## Goals / Non-Goals

**Goals:**
- Show the current UI: workspace + AI hint, and the problem list.
- Theme-correct images with no flicker or hydration warning.
- No external image host for landing assets.

**Non-Goals:**
- Reworking hero, features, how-it-works, use-cases copy.
- Re-shooting or editing the screenshots.

## Decisions

**Static imports + `next/image`.** `import contestLight from "@/assets/contest-problem-light.png"` gives width/height (no layout shift), blur placeholder, and responsive `srcset`. Alternative: move files to `public/` and use string paths — loses intrinsic sizing and blur for no gain. Files stay in `web/assets/` where the user put them.

**Theme switching via CSS, not JS.** Render both variants; light gets `dark:hidden`, dark gets `hidden dark:block`. Alternative: `useTheme()` to pick one `src` — server doesn't know the theme, causing a hydration mismatch or a flash. CSS cost is an extra image download per pair; mitigated by `next/image` lazy-loading (hidden `display:none` images below the fold aren't fetched in modern browsers) and a small `ThemedScreenshot` helper keeping markup DRY.

**`ThemedScreenshot` helper** — local to the landing page (`app/[locale]/_components/themed-screenshot.tsx`): props `light`, `dark` (StaticImageData), `alt`, `sizes`, `className`, `priority?`. Wraps the two `<Image>`s.

**Drop `Safari` frame.** Its fixed viewport would crop ~40% of the workspace screenshot (losing the failed-submission card that motivates the AI overlay). Use a plain bordered frame (`border bg-background/50 p-2 shadow-2xl`, keeping the existing glow) that matches the page's `rounded-none` style. `safari.tsx` has no other consumer → delete it. Alternative: parametrize `Safari`'s aspect ratio — more work than the chrome is worth, and the screenshots already include their own app chrome.

**AI overlay layout.** Workspace frame is `relative`; on `md+` the help screenshot is `absolute -bottom-12 -right-8 w-[38%]` with its own border/shadow, slight entrance animation consistent with existing `animate-in` usage. Below `md` it's static, stacked under the workspace with `mt-6`. The submission section copy gets a line mentioning AI hints.

**Problem library section** inserted after the submission section, before Features, same section shell (`max-w-5xl`, `mt-40`, title + description + framed screenshot). New keys `HomePage.landing.problems.{title,description}`.

**Alt text keys:** `HomePage.landing.alt.{workspace,aiHelp,problems}` in `en.json` and `br.json`.

## Risks / Trade-offs

- [Both theme variants downloaded] → lazy loading + only above-fold image uses `priority` (none here; previews are below the hero). Total ~500 KB raw, optimized by Next.
- [Screenshots go stale again] → they live in the repo now; updating is a file replace, no blob upload.
- [Screenshot shows a real user's name ("Juan D. Anjos") in problems list] → it's the author's own account; acceptable, noted for the user.
- [Overlay covers part of workspace editor on md widths] → overlay anchored bottom-right over the empty editor area, not the submission card.
