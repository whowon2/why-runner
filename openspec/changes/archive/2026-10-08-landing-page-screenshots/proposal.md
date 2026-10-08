## Why

The landing page's only product preview is a single outdated screenshot (`example.png`, hosted on Vercel Blob) that predates the current workspace UI, the problem list redesign, and the contest AI assistant. It also ignores the visitor's theme, so dark-mode visitors see a light screenshot. Fresh light/dark screenshots now live in `web/assets/`, so the landing page can show what the product actually looks like today.

## What Changes

- Replace the Vercel Blob `example.png` preview in the "Live Submission Interface" section with the new contest problem workspace screenshot (`contest-problem-{light,dark}.png`).
- Overlay the AI assistant dialog screenshot (`help-{light,dark}.png`) on the workspace preview, showing the failed-submission → AI hint flow the screenshot already sets up (failed test case + brain button).
- Add a new landing section showcasing the problem library (`problems-{light,dark}.png`) with its own title/description copy.
- Every screenshot SHALL follow the active theme: light image in light mode, dark image in dark mode, with no flash or hydration mismatch.
- Screenshots are served from the repo via static imports (`next/image`) instead of an external blob URL.
- Drop the `Safari` browser-chrome mockup on the landing page: its fixed 1200×700 viewport would crop the near-square workspace screenshot (1410×1193), cutting off the failed-submission card. Replace with a plain framed screenshot at its natural aspect ratio.
- Update the "Built with modern tools" chips: remove `tRPC` and `SQS` (no longer used), add the actual stack (React Query, Tailwind CSS, Better Auth, Gemini, isolate).
- New i18n strings (en + br) for the problem-library section and screenshot alt text.

## Capabilities

### New Capabilities
- `landing-page`: Public home page product previews — which screenshots appear, theme-matched rendering, accessibility (alt text), and localized copy.

### Modified Capabilities
<!-- none -->

## Impact

- `web/app/[locale]/page.tsx` — preview section rewritten, new problem-library section.
- `web/assets/*.png` — now imported by the app (static imports, bundled by Next).
- `web/messages/en.json`, `web/messages/br.json` — new `HomePage.landing.*` keys.
- `web/components/ui/safari.tsx` — no longer used by the landing page (only consumer); removed.
- No backend, DB, or judge changes.
