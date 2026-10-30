## 1. Example plays on custom runs (web)

- [x] 1.1 `lib/compare-output.ts` `outputsMatch(mode, epsilon, actual, expected)` mirroring `judge/src/compare.rs` (null for checker) + `compare-output.test.ts` porting the Rust cases; cross-reference comments in both files
- [x] 1.2 `getExercise`: include problem `compareMode` and `floatEpsilon` in returned problem columns
- [x] 1.3 `hooks/use-example-runs.ts`: per-index play state, `play(index)`, sequential `playAll()` awaiting terminal run status, stop on create error
- [x] 1.4 i18n keys (pt, en) for match / mismatch / no-verdict (checker) / play / run all

## 2. Shared workspace shell (web)

- [x] 2.1 `lib/workspace-routes.ts` `isWorkspacePath` + unit tests; `SiteChrome` client wrapper hiding `UserDock`/`Footer` on workspace paths in `app/[locale]/layout.tsx`
- [ ] 2.2 Drafts: the shell's code editor uses the existing `useCodeDraft` (editor-drafts spec) for all three contexts, contest target `contest:<contestId>:<problemId>`; drop contest `upload.tsx`'s own copy
- [x] 2.3 `pendingRefetchInterval` in `lib/submission-status.ts`; apply to `useProblemPracticeSubmissions`, `useProblemSubmissions`, `useExerciseSubmissions`
- [x] 2.4 `components/workspace/workspace-context.tsx` (`WorkspaceSource`, `WorkspaceAnswer`, last-event state)
- [x] 2.5 `workspace-shell.tsx`: top bar, rail, resizable statement/editor and editor/bottom splits, `100dvh` no page scroll
- [x] 2.6 `editor-pane.tsx`: `CodeEditor` + language select, open file, reset, maximize; blocks and Parsons variants; locked-reason state
- [x] 2.7 `CodeEditor`: controlled `maximized`/`onMaximizedChange` props; shell collapses statement + bottom panels; Esc handling unchanged
- [x] 2.8 `test-cases-panel.tsx`: visible tests with Play (only when `runsEnabled`), per-test match/status from `useExampleRuns`, hidden count, row click → console
- [x] 2.9 `actions-panel.tsx`: Run (custom stdin), Run all, Submit, live latest-submission verdict + passed/total + AI help (respecting `aiMaxLevel`)
- [x] 2.10 `console-panel.tsx`: collapsible (persisted), custom-run stdin box, renders custom-run result / example play (input, expected, output, match) / `SubmissionDetails`, auto-expands on new event
- [x] 2.11 `submission-history-drawer.tsx` (Sheet): list, expandable code/report, "Load into editor"
- [x] 2.12 Settings drawer: font size + theme toggle
- [x] 2.13 Narrow layout: Statement/Code/Results bottom switcher, CSS-hidden views, rail in top-bar menu, auto-switch to Results on run/submit
- [x] 2.14 i18n keys (pt, en) for shell labels

## 3. Practice problem page

- [ ] 3.1 Rewrite `problems/_components/workspace/index.tsx` as the practice adapter (tests from `useProblemTests`, submit via `useCreateProblemSubmission`, runs with `context: "problem"`, top-bar solved status, difficulty/limits)
- [ ] 3.2 Statistics and Tests (full download) drawers from `statistics.tsx` / `tests.tsx`; delete `submit.tsx`/`results.tsx` once their pieces are moved
- [ ] 3.3 `problems/[slug]/edit/page.tsx` (owner/admin only, edit form, Publish/Delete, "Try in workspace" link); Edit rail item for owners
- [ ] 3.4 `problems/[slug]/page.tsx`: draft-owner redirect to `/edit`, legacy `?tab=` redirects/mapping to `?panel=`
- [ ] 3.5 Update links that point at `?tab=` (command palette, notifications, home cards, problem list) — grep `tab=`

## 4. Contest problem page

- [ ] 4.1 Route `contests/[slug]/problems/[problemSlug]/page.tsx` (contest + membership of problem, `notFound` otherwise)
- [ ] 4.2 `ContestProblemGate` moved from `tabs/problem/index.tsx` (not started countdown, pending join, non-participant before end)
- [ ] 4.3 Contest adapter: rail letters with live solved marks (`useUserContestStatus`), Leaderboard drawer, timer + solved count in top bar, submit via `useCreateSubmission` (keep its invalidations), runs with `context: "contest"` gated by `contest.allowRuns`, AI level from `contest.aiAssistance`, locked when solved/ended/non-participant
- [ ] 4.4 Replace Problems tab content with a problem list linking to the route; redirect `?tab=problems&problem=` in `ContestTabs`/page; remove `upload.tsx`, `submission-list.tsx`, `select-problem.tsx` once unused
- [ ] 4.5 Update links into contest problems (home running-contest card, notifications, palette)

## 5. Lesson exercise page

- [ ] 5.1 `classes/_components/exercise-workspace.tsx` adapter: tests/hiddenCount from `useExercise`, mode-specific editor, submit via `useCreateExerciseSubmission`, runs with `context: "exercise"` (none for parsons), compare settings from `getExercise`, constraints notice + mode hint in statement, completed status, prev/next in rail, Back to roadmap
- [ ] 5.2 Exercise page renders it; remove `ExerciseDetail`/`ExerciseHeader` (keep `exercise-similarity` route working)
- [ ] 5.3 Locked state when `submissionsLocked`

## 6. Docs, versions, verification

- [ ] 6.1 Update `web/CLAUDE.md` (workspace shell, `isWorkspacePath` rule, example plays via custom runs); bump `web/package.json` minor
- [ ] 6.2 `bun lint`, `bun test lib`, `bun build`
- [ ] 6.3 Browser check with test accounts (student + teacher) on `$DEV_PORT`: practice submit shows verdict inline; custom Run, Play one / Run all with match markers (needs `CUSTOM_RUN_ENABLED=true` + local judge); contest timer, letters, leaderboard drawer, solved lock; lesson code/blocks/parsons submit + run; drafts survive reload; maximize + Esc; 390px and 768px widths; old `?tab=` and `?problem=` URLs redirect
