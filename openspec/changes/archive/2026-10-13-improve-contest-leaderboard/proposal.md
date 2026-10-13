## Why

The contest leaderboard predates most of the contest work (lifecycle, private contests, constraints, problem codes) and has fallen behind. It ranks only by `userOnContest.answered.length`, so ties are broken arbitrarily and there is no notion of speed or wrong attempts; it shows nothing but a medal icon per solved problem; it never refreshes while a contest is running; and its server action has no access check and ships the full `user` row (email included) for every participant to any caller, including for draft and private contests.

## What Changes

- Rank participants ICPC-style: most problems solved first, then lowest penalty time (minutes from contest start to each accepted submission, plus a fixed penalty per rejected attempt before acceptance). Participants with identical solved/penalty share a rank.
- Compute standings from the `submission` table (keyed by `problemId`, not by letter) instead of the `answered` letter array, so the board reflects attempts, solve times, and pending judgments. `answered` stays as-is for submission gating.
- Per-problem cells show state (solved / attempted-not-solved / pending / untouched), the number of attempts (always visible), and the solve time; the first participant to solve each problem is marked ("first solve").
- Fixed table layout: all problem columns share one width (today a solved column renders wider than empty ones), names truncate instead of stretching the table.
- Leaderboard auto-refreshes on an interval while the contest is running, and stops once it has ended.
- The current viewer's row is highlighted and, when off-screen, reachable via a pinned "you" row.
- **BREAKING (server action shape)**: `getContestLeaderboard` returns a computed standings object (problems + ranked rows with minimal public user fields) instead of raw `userOnContest` rows with full `user` records.
- Apply the same visibility rules as `getContest`: draft contests only to the owner, private contests only to the owner and accepted participants.
- **BREAKING (export format)**: Owner export becomes a ZIP bundle: `standings.csv` (same computation and order as the leaderboard), `submissions.csv` (every submission with language, status, timestamps, minute from start, runtime/memory, judge output, counted flag), and each submission's source code as a file. CSV fields are properly escaped (today a `"` in a name corrupts the file).
- Fix the leaderboard React Query key (`["contests", id]`, which shares the list-query namespace) to a dedicated `["contest-leaderboard", id]` key and update the invalidations that target it.

## Capabilities

### New Capabilities
- `contest-leaderboard`: How contest standings are computed (scoring, penalty, tie-breaking, which submission statuses count), what each cell shows and how the table is laid out, who may view them, how they stay up to date, and what the owner's export bundle contains.

### Modified Capabilities
- `query-cache-invalidation`: adds a requirement that participant/problem mutations refresh the contest leaderboard query.

## Impact

- `web/lib/actions/contest/get-contest-leaderboard.ts` — rewritten; new pure standings helper (e.g. `web/lib/contest/standings.ts`) shared with export.
- `web/lib/actions/contest/export-contest.ts` — rewritten to build a ZIP (existing `jszip` dep) from shared standings + submissions.
- `web/app/[locale]/contests/_components/tabs/management/export.tsx` — download `.zip` instead of `.csv`.
- `web/hooks/use-contest-leaderboard.tsx` — new query key, conditional `refetchInterval`.
- `web/app/[locale]/contests/_components/tabs/leaderboard/index.tsx` — new table UI.
- `web/app/[locale]/contests/_components/join-and-leave.tsx`, `tabs/management/pending-joins.tsx`, `web/hooks/use-join-contest.tsx`, `use-leave-contest.tsx`, `use-remove-problem.tsx` — invalidate the new key.
- `web/messages/en.json`, `web/messages/br.json` — new Leaderboard strings.
- `web/hooks/use-add-problem.tsx`, `tabs/settings/problems.tsx` (reorder) — also invalidate the leaderboard key.
- No DB migration; no judge changes.
