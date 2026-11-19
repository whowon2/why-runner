## Context

The web waits for judge results by polling React Query hooks that call server actions. Today each hook picks its own interval:

| Hook | Today |
|---|---|
| `use-run` | 1 s while `PENDING`/`RUNNING` **or data undefined** (`getRun` throws "Run not found" → polls forever) |
| `use-example-runs` (`waitForRun`) | unbounded `for(;;)` loop, 1 s |
| `use-exercise-submissions`, `use-problem-submissions` | 2 s while pending, **10 s otherwise** |
| `use-problem-practice-submissions`, `use-exercise-mode`, `use-problem-validation` | 2 s while pending, then off |
| `use-user-contest-status` | **10 s always** (returns `answered`, which only changes on the user's own verdict) |
| `use-contest-leaderboard` | 10 s while the contest runs (kept) |
| `use-unread-notification-count` | 30 s + focus (kept) |

Constraints: `refetchIntervalInBackground` is false (hidden tabs already pause); global `staleTime` is 5 min, so views rely on mutation invalidation. The judge reaps stale `RUNNING` rows (runs 2 min, submissions 5 min with retries) but nothing ends a `PENDING` row no worker claims. Infra is co-located in São Paulo (Vercel `gru1`, Neon `sa-east-1`, Fly `gru`), so one poll costs ~tens of ms.

Explored and deferred: SSE/WebSockets on Vercel (Hobby 300 s cap, LISTEN needs a direct Neon connection per stream, keeps Neon awake), a Fly realtime service, moving web to Fly, moving the DB to Supabase Realtime. If push is ever added, it would be a content-free "row changed" ping that invalidates these same queries, with this change as the fallback.

## Goals / Non-Goals

**Goals:**
- One pure, unit-tested schedule used by every judge-result query.
- Polling is bounded in time, never runs on missing data, and never runs idle.
- Derived views (contest status, leaderboard, history) update on the user's own verdict without their own timers.

**Non-Goals:**
- Realtime push of any kind.
- Judge-side handling of never-claimed `PENDING` rows (separate task in `judge/`).
- Changing the leaderboard interval or notification polling.
- DB changes; the only server-action change is `getRun` returning `null` for a missing run (D4).

## Decisions

**D1. Schedule keyed on `createdAt`, not on a per-component timer.** `nextPollMs(ageMs)` returns 1000 (<10 s), 2000 (<60 s), 5000 (<120 s), 10000 (<300 s), else `false`. Age-based means a reload, remount or second tab continues the same back-off and the 5-minute stop holds instead of restarting at 1 s. Alternative: exponential backoff from first observation (attempt count): simpler but resets on every remount, which is exactly how a stuck row kept polling. All needed rows already return `createdAt` (`codeRun`, `submission`, `problemValidation`).

**D2. Clock-skew guard via first-observed time.** The age comes from the server's `createdAt` against the client's clock. A module-level `Map<rowId, firstSeenMs>` records when the page first saw each pending row. Stop when `observed ≥ 5 min`, or when `age ≥ 5 min` and `observed ≥ 30 s`. A client clock behind the server cannot poll forever; a clock ahead cannot stop a fresh row instantly. Alternative: return server `now` from every action — more accurate but touches every action's return type.

**D3. Lists: youngest pending row drives the interval.** `listPollMs(rows)` filters pending rows, takes the minimum age, and applies D1/D2 to it. A list with no pending row returns `false` (no idle polling). A newer submission always comes with a mutation that invalidates the list, so idle polling only ever caught rows created in another tab or by someone else — acceptable to lose (the leaderboard keeps its interval for the cross-user case).

**D4. Missing data / errors stop polling.** `refetchInterval` returns `false` when `query.state.data` is null/undefined or `status === "error"`. `getRun` returns `null` instead of throwing "Run not found" (production Next.js replaces thrown server-action messages, so the client could not tell "not found" from a transient error); the console shows "run unavailable" for `null` or an error. Transient errors keep React Query's default retries.

**D5. "Still judging" is derived, not stored.** A hook exposes `stuck: boolean` (the schedule returned `false` while a row is pending). **Check again** calls `refetch()` once; it doesn't reset `firstSeen`, so a still-pending row stays stuck. Shared small component for the console, test-cases panel and editor verdict. The run cancel button stays.

**D6. Transition detection in one place.** A small helper compares previous vs new data in the submission-list hooks (via a `useEffect` on the list keyed by submission id → status). On pending→final for the current user it invalidates `["user-contest-status", contestId]`, `contestLeaderboardKey(contestId)` (when contest-scoped) and `["submissions", "me"]`. Alternative: put the invalidation in `queryFn` — impure and harder to test.

**D7. `waitForRun` reuses the schedule.** The loop sleeps `nextPollMs` for the run and exits when it returns `false`, resolving with the still-pending run so the Play batch stops and the console shows "still judging".

## Risks / Trade-offs

- [A real judge queue backs up past 5 min during a busy contest] → Check again recovers; the judge-side reclaim/dead-letter keeps rows moving; the limit is a single constant.
- [A row created in another tab no longer shows up until that page refetches] → Accepted; focus/navigation refetches still apply after `staleTime`, and the submit path itself invalidates.
- [Back-off delays slow verdicts by up to 5–10 s after the first minute] → Acceptable; typical judging finishes inside the 1–2 s band.
- [Module-level `firstSeen` map grows] → Entries removed when a row is final; bounded by the rows a page shows.

## Migration Plan

Client-only. Ship behind no flag; rollback = revert the web deploy. Web minor version bump.

## Open Questions

- None blocking. Follow-up: judge task to fail `PENDING` runs/submissions no worker claims within N minutes, so the server ends them too.
