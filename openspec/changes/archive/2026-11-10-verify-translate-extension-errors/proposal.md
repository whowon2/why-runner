## Why

In the 2026-10-29 classroom test the professor (lesson author) reported generic errors while coding whenever a browser auto-translate extension translated the site (survey item P9). PR #81 marked code surfaces `translate="no"`, but that fix was never checked against a real translate extension through the full run/submit/locale-switch flow, so P9 is only "likely fixed".

## What Changes

- Reproduce P9 in the Helium browser with its translate extension: translate a lesson exercise page and a problem page, then write, run and submit code, and switch the site locale, reading the console for React DOM errors (`removeChild` / `insertBefore`, hydration, uncaught errors).
- If a crash reproduces: fix its root cause, either by marking the remaining workspace surfaces `translate="no"` or by wrapping bare dynamic text (conditional text siblings) in elements so React never touches translator-replaced text nodes.
- If nothing reproduces: no code change; record the verification result.
- Update `docs/evaluation/post-evaluation-changes.md` with the P9 outcome and bump `web/package.json` (patch) if code changes.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `translation-safe-rendering`: adds a requirement that the whole coding flow (run, submit, verdict display, locale switch) keeps working with a translate extension active, not only language selection.

## Impact

- Possibly `web/components/workspace/*`, `web/components/code-run/*`, `web/components/submissions/*`, `web/app/[locale]/classes/_components/exercise-*.tsx`, `web/app/[locale]/problems/_components/workspace/*`.
- Docs: `docs/evaluation/post-evaluation-changes.md`.
- No DB, judge or API changes.
