## 1. Building blocks

- [x] 1.1 Create `web/app/[locale]/_components/themed-screenshot.tsx`: renders light (`dark:hidden`) and dark (`hidden dark:block`) `next/image` variants from static imports, with `alt`, `sizes`, `className`, `placeholder="blur"`
- [x] 1.2 Add i18n keys to `web/messages/en.json` and `web/messages/br.json`: `HomePage.landing.problems.{title,description}`, `HomePage.landing.alt.{workspace,aiHelp,problems}`; tweak `landing.submission.description` to mention AI hints

## 2. Landing page

- [x] 2.1 In `web/app/[locale]/page.tsx`, replace the `Safari` preview with a framed `ThemedScreenshot` of `contest-problem-{light,dark}.png` (natural aspect, existing glow kept)
- [x] 2.2 Overlay `help-{light,dark}.png` on the workspace frame at `md+` (absolute, bottom-right, over the editor area); stack it below the frame on mobile
- [x] 2.3 Add the problem library section (title, description, framed `problems-{light,dark}.png`) between the submission section and Features
- [x] 2.4 Delete `web/components/ui/safari.tsx` after confirming no remaining imports; remove the blob URL
- [x] 2.5 Update "Built with modern tools" chips to the real stack: drop `tRPC`/`SQS` (replaced by server actions and Postgres LISTEN/NOTIFY); add React Query, Tailwind CSS, Better Auth, Gemini, isolate

## 3. Verify

- [x] 3.1 `bun lint` and `bun run build` pass in `web/`
- [x] 3.2 Run dev server; check `/en` and `/br` in light and dark themes at desktop and mobile widths: correct variants, no cropping, no hydration warning in console, overlay doesn't cover the submission card
