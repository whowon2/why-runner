## Why

On 2026-11-10 a prod problem page fired ~142 server-action POSTs in 3.7 minutes because its jobs stayed `PENDING` (the prod judge was stale and never claimed them). Nothing ends a never-claimed `PENDING` row (the judge only reaps stale `RUNNING` ones), and the client polls judge results with no backoff, no time limit, forever when a run is missing, and every 10 s even when nothing is being judged. Each tick is a Vercel invocation plus Neon queries and keeps the Neon compute from auto-suspending.

Realtime push (SSE/WebSockets on Vercel, a Fly realtime service, moving web to Fly or the DB to Supabase) was explored and deferred: with functions now in `gru1` next to Neon (`sa-east-1`) and the judge (`gru`), a short poll while judging is close to instant, and bounded polling is needed as push's fallback anyway.

## What Changes

- One shared, pure polling schedule for judge-backed rows (runs, submissions, validations, parsons checks), keyed on the row's age (`createdAt`): 1 s while young, backing off to 10 s, and stopping once the row has been pending for 5 minutes.
- A stopped poll shows a "still judging" state with a **Check again** action (one manual refetch); a run keeps its cancel action.
- Polling stops when the row cannot be loaded (`getRun` "Run not found", query error) instead of polling every second forever; "not found" is not retried.
- The examples "Play" loop (`useExampleRuns.waitForRun`) uses the same schedule and limit instead of an unbounded 1 s loop.
- No idle polling: submission lists (exercise, contest problem) stop polling when nothing is pending; `useUserContestStatus` stops polling every 10 s. New rows arrive through the submit mutations' invalidation (already in place).
- When one of the current user's submissions goes from pending to a final status, the views derived from it are invalidated: contest status (`answered`), the contest leaderboard, and the user's submission history.
- Unchanged: the contest leaderboard's running-contest poll (≤ 15 s) and the unread notification count (30 s + focus).

## Capabilities

### New Capabilities
- `judge-result-polling`: how the web waits for judge results: the age-based schedule, the 5-minute stop and "still judging" state, no polling on missing rows or errors, no idle polling, and invalidation of derived views on a verdict transition.

### Modified Capabilities
- `custom-run`: "poll until it finishes" becomes the bounded `judge-result-polling` schedule with a stuck state.
- `editor-latest-verdict`: the fixed "at least every 2 seconds" refresh becomes the shared schedule, plus the stuck state next to the submit button.
- `contest-leaderboard`: the viewer's own leaderboard also refreshes when their submission gets its verdict, not only on the interval.

## Impact

- `web/lib/` new pure module for the schedule (+ `bun test`).
- `web/hooks/`: `use-run`, `use-example-runs`, `use-exercise-submissions`, `use-problem-submissions`, `use-problem-practice-submissions`, `use-exercise-mode`, `use-problem-validation`, `use-user-contest-status`.
- Run console / test-cases panel / editor verdict components: "still judging" + Check again; pt/en messages.
- `getRun` returns `null` for a missing run instead of throwing. No DB, judge or dependency changes. Web minor version bump.
- Follow-up outside this change: the judge failing `PENDING` rows that no worker claims (separate task in `judge/`).
