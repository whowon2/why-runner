## 1. Schedule module

- [x] 1.1 Add a pure module in `web/lib/` (e.g. `judge-poll.ts`) with `nextPollMs(ageMs, observedMs)` and `listPollMs(rows, now)` per design D1–D3 (thresholds 10 s / 60 s / 120 s / 300 s; 30 s observation guard), plus the `firstSeen` tracking helpers
- [x] 1.2 `bun test` coverage: each band, the 5-minute stop, skew guard (clock ahead / behind), youngest-row selection, no pending rows → `false`

## 2. Run polling

- [x] 2.1 `hooks/use-run.tsx`: use the schedule; no polling while data is undefined or on error; no retry on "Run not found"; expose `stuck`
- [x] 2.2 `hooks/use-example-runs.ts`: `waitForRun` sleeps per the schedule and exits on stop, ending the Play batch
- [x] 2.3 Console and test-cases panels (`components/workspace/console-panel.tsx`, `test-cases-panel.tsx`, `components/code-run/code-run.tsx`): "still judging" + Check again + Cancel, and a "run unavailable" error state

## 3. Submission and validation polling

- [x] 3.1 `use-exercise-submissions`, `use-problem-submissions`, `use-problem-practice-submissions`: `listPollMs`, no idle 10 s polling, expose `stuck`
- [x] 3.2 `use-exercise-mode` (parsons check) and `use-problem-validation`: same schedule on the latest row
- [x] 3.3 Editor verdict next to the submit button: "still judging" + Check again
- [x] 3.4 `use-user-contest-status`: remove `refetchInterval`

## 4. Verdict transition invalidation

- [x] 4.1 Helper that detects pending→final for the current user's submissions and invalidates `["user-contest-status", contestId]`, the contest leaderboard key and `["submissions", "me"]`; wire it into the submission-list hooks
- [x] 4.2 Confirm the submit mutations still invalidate every list that dropped idle polling (`mutation-cache-invalidation` skill)

## 5. Copy, version, verification

- [x] 5.1 pt/en messages for "still judging", Check again, run unavailable
- [x] 5.2 Bump `web/package.json` minor version
- [x] 5.3 `bun test`, typecheck, lint pass
- [ ] 5.4 Browser check with the judge stopped (dev port, email login): run and submission stay `PENDING` → requests back off (1 → 2 → 5 → 10 s) and stop at 5 min with "still judging"; start the judge, Check again shows the verdict; idle page sends no submission/contest-status requests; contest solve updates status + leaderboard immediately
