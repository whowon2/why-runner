## Why

Solving a problem today means juggling separate views: on a standalone problem the statement, editor, results and tests are five tabs, so a student submits and then has to switch to "Results" to learn the verdict; contests and lesson exercises each have their own, different split layout with the submission list buried under the statement. Custom runs (`code_run`, PR #89) now let students execute code with their own stdin, but not check it against the examples in one click. A single fullscreen workspace (CodinGame-style) where the verdict appears next to the editor right after submitting, plus a "run on examples" button, removes that friction for every place students write code — the main feedback from the 2026-10-29 classroom test.

## What Changes

- New shared **fullscreen editor workspace shell** used by the three pages that have a solution editor: standalone problem (`/problems/[slug]`), contest problem, and lesson exercise. Full viewport, no site dock/footer; thin top bar (title left, status/score right); slim left icon rail (Back, Submissions history, context-specific items, Settings); left column = scrollable statement with a collapsible **Console** panel at its bottom; right = large editor with language selector, reset, maximize; under the editor a **Test cases** panel (each visible example with a Play button and its last-run result) and an **Actions** panel (Run all test cases, Submit, live status of the latest submission).
- After **Submit**, the verdict (pending → final status, passed count, failing-test detail as redacted for the viewer, AI help where allowed) shows in the workspace without navigation. Submission history moves to a rail-opened drawer.
- **BREAKING (UI/URLs)**: the standalone problem page loses its Task/Submit/Results/Statistics/Tests tabs. Statistics and the full-test download move into rail drawers; the owner's Edit tab becomes its own page `/problems/[slug]/edit` (with Publish/Delete). Old `?tab=` links redirect to the closest equivalent.
- **BREAKING (UI/URLs)**: contest problems open in the shell at `/contests/[slug]/problems/[problemSlug]`, with an A/B/C… problem switcher and a leaderboard drawer in the rail and the contest timer in the top bar. The contest page's Problems tab becomes a problem list linking there; old `?tab=problems&problem=<slug>` links redirect.
- Lesson exercise page (`/classes/…/exercises/[exerciseSlug]`) uses the shell, with previous/next exercise in the rail; blocks and Parsons modes render their editors in the editor slot.
- **Play examples** on top of the existing custom runs (`code_run`): each visible example gets a Play button that runs the code with that example's input; "Run all test cases" plays them one after another. The browser compares stdout with the expected output the student already sees, using the problem's compare mode (exact/tokens/float; checker problems show output only). No new table and no judge change; same gates (`CUSTOM_RUN_ENABLED`, `contest.allowRuns`) and limits as custom runs. The custom-run stdin box moves into the Console.
- Code drafts are saved per problem + language in `localStorage` in all three contexts (today only contests do), via one shared hook.
- Narrow screens (< 1024px): single column with a bottom switcher (Statement / Code / Results); one editor instance stays mounted; submitting switches to Results.

## Capabilities

### New Capabilities
- `editor-workspace-shell`: the fullscreen layout, its panels (statement, console, editor, test cases, actions, history drawer, rail, top bar), per-context content, draft persistence and the narrow-screen fallback.

### Modified Capabilities
- `problem-workspace`: tabbed workspace replaced by the shell; Statistics/Tests become drawers; Edit becomes its own page; old tab URLs redirect.
- `contest-problem-layout`: contest problem view moves to its own fullscreen route with problem switcher, leaderboard drawer and timer; previous in-tab split layout requirements replaced.
- `custom-run`: Run/stdin placement moves into the shell's Console/Actions; new "Play visible examples" requirement (client-side comparison against visible expected output).
- `code-editor-controls`: fullscreen toggle becomes a "maximize editor" inside the shell (hides statement and bottom panels) instead of a fixed overlay; requirement text updated.

## Impact

- **web**: new `components/workspace/` (shell + panels), `hooks/use-solution-draft.ts`, `hooks/use-example-runs.ts`, `lib/compare-output.ts` (TS port of `judge/src/compare.rs` rules, unit-tested); rewrites of `app/[locale]/problems/_components/workspace/*`, `contests/_components/tabs/problem/*`, `classes/_components/exercise-detail.tsx`/`exercise-header.tsx`; new routes `problems/[slug]/edit`, `contests/[slug]/problems/[problemSlug]`; root layout hides `UserDock`/`Footer` on workspace routes; `getExercise` additionally returns the problem's `compareMode`/`floatEpsilon`; new i18n keys (pt, en). Web minor version bump.
- **DB / judge**: no changes.
- Docs: `web/CLAUDE.md` (workspace shell, `isWorkspacePath` rule, example plays).
