## Context

The leaderboard tab (`web/app/[locale]/contests/_components/tabs/leaderboard/index.tsx`) calls `getContestLeaderboard`, which returns every accepted `userOnContest` row with `with: { user: true }`. The client sorts by `answered.length` and renders an `Award` icon per letter present in `answered`.

`answered` is a `text[]` of problem letters that the judge appends to on PASSED (`judge/src/db.rs`, `array_append ... WHERE NOT ($1 = ANY(answered))`). Letters are index-based; `reorderProblems` is blocked once a contest starts, so letters are stable during a run. `createSubmission` uses `answered` to reject resubmits of solved problems.

Problems today:
- No tie-break, no penalty, no attempt counts, no pending state.
- No polling (`useUserContestStatus` polls every 10s, the leaderboard does not).
- Server action has no auth check and leaks full user rows (email, etc.).
- Query key `["contests", id]` sits in the contests-list namespace; `use-create-contest`/`use-delete-contest` invalidate the whole `["contests"]` prefix by accident, and `join-and-leave` invalidates it on purpose.
- `exportContestData` ranks independently by `answered.length`.

## Goals / Non-Goals

**Goals:**
- One pure, unit-testable standings function used by both the leaderboard action and CSV export.
- ICPC-style ranking (solved desc, penalty asc, shared ranks).
- Richer cells: solve time, attempts, pending, first solve.
- Correct access control and minimal user fields.
- Live refresh during the running window only.

**Non-Goals:**
- Scoreboard freeze / hidden last-hour results.
- Partial scoring per test case (judge gives pass/fail only).
- Changing `answered` or the judge; it stays as the submission gate.
- Enforcing start/end time in `createSubmission` (separate fix; standings simply ignore out-of-window submissions).
- Configurable penalty per contest (fixed 20 min for now).
- Realtime push (SSE/WebSocket); polling is enough at contest scale.

## Decisions

**1. Derive from `submission`, not `answered`.**
`answered` has no timestamps or attempt counts. Submissions carry `problemId`, `status`, `createdAt`, `userId`, `contestId`. Matching by `problemId` (not `questionLetter`) avoids any dependence on letter/index mapping.
_Alternative_: add `solvedAt`/`attempts` columns to `userOnContest` maintained by the judge → requires migration + Rust changes + backfill, and duplicates data already in `submission`. Rejected.

**2. Use `createdAt` as event time.**
Solve time is measured to submission creation, not judging completion (`updatedAt`), so judge queue latency doesn't penalise participants.

**3. Pure function `computeStandings(input)` in `web/lib/contest/standings.ts`.**
Input: contest `{ startDate, endDate }`, ordered problem ids, participants (`{ id, name, username, image }`), and a lean list of submissions (`{ userId, problemId, status, createdAt }`). Output: `{ problems: { problemId, letter, firstSolveUserIds }[], rows: { rank, user, solved, penalty, cells: Record<problemId, Cell> }[] }`. No DB access → trivially checkable. `web` has no test runner, so verify with a throwaway script (fixtures covering each spec scenario) run via `bunx tsx`/`npx tsx` rather than adding a test dependency.
_Alternative_: compute in SQL with window functions → harder to read/test and to share with export. Data volume per contest (hundreds of submissions) makes in-memory fine.

**4. Status classification.**
- solved: `PASSED`
- rejected: `FAILED`, `CONSTRAINT_VIOLATION`
- pending: `PENDING`, `RUNNING`, `PENDING_CONSTRAINT_CLASSIFICATION`
- ignored: `ERROR` — the judge uses `ERROR` for dead-lettered submissions (infra failures after retries), so penalising it would punish participants for judge faults.
Submissions after the first PASSED for a problem are ignored (shouldn't exist given the `answered` gate, but be defensive).

**5. Server action shape and access.**
`getContestLeaderboard(contestId)` loads the contest (status, isPrivate, createdBy, dates), checks the same rule as `getContest` (draft → owner only; private → owner or accepted member), then queries ordered problems, accepted participants with `columns: { id, name, username, image }`, and submissions filtered by `contestId` selecting only the four needed columns. Returns `null` when not allowed. Owner is not listed unless they are also a `userOnContest` row (current behaviour).

**6. Query key + polling.**
New key `["contest-leaderboard", contestId]`. Hook takes the contest's `startDate`/`endDate` and sets `refetchInterval` to 10 000 ms when `now ∈ [start, end)` (or no end set and started), else `false`. Interval re-evaluated per render via function form of `refetchInterval` so it stops naturally when the end passes. Update the call sites that change participants or problems — `join-and-leave.tsx` (via `use-join-contest`/`use-leave-contest`), `tabs/management/pending-joins.tsx` (approve/reject), and `use-remove-problem` — to invalidate the new key (follow the `mutation-cache-invalidation` skill).

**7. UI.**
Keep shadcn `Table` inside the existing Card, but switch to `table-fixed` with a `<colgroup>`: rank `w-12`, participant auto (fills remaining width, `truncate` + `title` for full name), each problem `w-16`, Solved `w-16`, Penalty `w-20`. This fixes today's uneven spacing, where `w-[160px]` on name plus auto-layout lets content (the icon in A) widen some problem columns. Participant cell: avatar + name linking to the profile. Rank: shared ranks, medals for 1–3.
Problem cell is a small tinted block (semantic success/destructive/muted tokens, no hard-coded hex): primary line = attempt count, secondary line = solve minute (`34'`) when solved; pending shows a spinner/clock beside the count; untouched shows `–`. First solve adds a distinct accent (e.g. darker success fill + star) with a tooltip. Attempt count is always visible, never hover-only.
Sticky header and sticky rank/participant columns for horizontal scroll on narrow screens. Viewer row: `bg-primary/5` highlight; pinned copy rendered as a sticky `bottom-0` row when an `IntersectionObserver` reports the real row not visible.

**8. Export as ZIP bundle.**
`exportContestData` becomes owner-only (as today) and builds a ZIP with the already-installed `jszip` on the server, returning it base64-encoded; `tabs/management/export.tsx` decodes to a Blob and downloads `<contest-slug>-export.zip`.
- `standings.csv` from `computeStandings` (same as screen; email allowed, owner-only).
- `submissions.csv` from a submissions query joined with user (name, username, email) and problem (title), plus fields already on `submission` (language, status, constraintViolationDetail, createdAt, runtimeMs, memoryKb, codeSize, output). "Counted" = inside the contest window and not after the participant's first PASSED for that problem — expose this from `standings.ts` (e.g. a shared `isCounted` helper) so both outputs agree. `output` truncated to ~2 KB in the CSV.
- `code/<username>/<letter>-<seq>-<status>.<ext>` with a `Language → extension` map (reuse an existing one in `web/lib` if present, else add next to the export).
- A small `toCsv(rows)` helper with RFC 4180 escaping replaces the current `"${cell}"` joining, which corrupts any field containing `"`.
_Alternatives_: one CSV with a code column — multi-line code breaks most spreadsheet imports; XLSX — needs a new dependency and still awkward for code. ZIP keeps tables spreadsheet-friendly and code readable as files.

## Risks / Trade-offs

- [Standings and `answered` disagree (e.g. PASSED after `endDate` is in `answered` but not counted)] → Acceptable and intentional: `answered` is a gate, standings are the ranking. Document in code comment.
- [Polling load: N viewers × every 10s × full submission scan] → Single indexed-ish query per contest; contests are small. If needed later, add an index on `submission(contest_id)` or cache per contest for a few seconds.
- [`startDate` null makes solve time always 0] → Ranking falls back to solved count + attempt penalty, which is still deterministic. Contests created via current UI normally have dates.
- [Breaking server action shape] → Only consumer is the leaderboard component; updated in the same change.
- [Large contests make the export payload big (base64 over a server action)] → Truncate `output` in CSV; code stays full. Hundreds of submissions × a few KB is well within limits; move to a route handler streaming the ZIP if it becomes a problem.
- [Export format change (CSV → ZIP)] → Owner-only feature, button label/filename updated; no external consumers known.

## Migration Plan

No DB migration. Ship web only. Rollback = revert the commit.

## Open Questions

- Should penalty (20 min) become a contest setting later? Deferred; constant lives in `standings.ts`.
- Should `createSubmission` reject submissions outside the contest window? Tracked separately.
