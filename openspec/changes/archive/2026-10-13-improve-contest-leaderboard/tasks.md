## 1. Standings core

- [x] 1.1 Create `web/lib/contest/standings.ts` with types (`StandingsInput`, `Cell` = solved/attempted/pending/untouched, `StandingsRow`, `Standings`) and a `PENALTY_PER_REJECTION_MIN = 20` constant
- [x] 1.2 Implement status classification (PASSED → solved; FAILED/CONSTRAINT_VIOLATION → rejected; PENDING/RUNNING/PENDING_CONSTRAINT_CLASSIFICATION → pending; ERROR → ignored) and the contest time-window filter on `createdAt`
- [x] 1.3 Implement per-cell computation (earliest PASSED, rejected attempts before it, solve minutes from `startDate`, pending flag; ignore anything after first PASSED)
- [x] 1.4 Implement row totals (solved count, penalty over solved problems only), sorting (solved desc, penalty asc, name asc) and standard competition ranking (1, 2, 2, 4)
- [x] 1.5 Compute first-solve user ids per problem (earliest PASSED `createdAt`, ties all marked)
- [x] 1.6 Cover every standings scenario in `specs/contest-leaderboard/spec.md` with `lib/contest/standings.test.ts` (`bun test lib`)

## 2. Server action

- [x] 2.1 Rewrite `web/lib/actions/contest/get-contest-leaderboard.ts`: load contest, enforce draft/private visibility like `getContest`, return `null` when not allowed
- [x] 2.2 Query ordered problems (`problemOnContest.order`), accepted participants with only `id, name, username, image`, and contest submissions selecting only `userId, problemId, status, createdAt`
- [x] 2.3 Return `computeStandings(...)` output; confirm via type inspection no email/private user field reaches the payload

## 3. Hook and cache

- [x] 3.1 Update `web/hooks/use-contest-leaderboard.tsx`: key `["contest-leaderboard", contestId]`, accept `startDate`/`endDate`, function-form `refetchInterval` = 10000 only while running, else `false`
- [x] 3.2 Replace `["contests", id]` invalidations in `join-and-leave.tsx` with the new key; add leaderboard invalidation to `use-join-contest`, `use-leave-contest`, `pending-joins.tsx` approve/reject, and `use-remove-problem` (follow `mutation-cache-invalidation` skill)

## 4. Leaderboard UI

- [x] 4.1 Rebuild `tabs/leaderboard/index.tsx` on the new payload: rank column (shared ranks, medals 1–3), participant column (avatar + name linking to profile), one column per problem letter, Solved and Penalty columns
- [x] 4.2 Implement cell variants (solved: attempt count + solve minute; attempted: attempt count; pending: indicator + count so far; untouched: "–") using semantic color tokens, plus first-solve marker with tooltip; attempt count always visible
- [x] 4.3 Switch table to `table-fixed` with `<colgroup>` (rank `w-12`, participant auto with `truncate` + `title`, each problem `w-16`, Solved `w-16`, Penalty `w-20`); confirm A–J columns render equal width when only A has a solve
- [x] 4.4 Sticky header and sticky rank/participant columns; verify horizontal scroll at phone width
- [x] 4.5 Highlight viewer's row; add pinned bottom copy shown via `IntersectionObserver` when the real row is out of view; none for non-participants
- [x] 4.6 Handle `null` (not allowed) and empty-participants states; keep loading skeleton
- [x] 4.7 Add new strings (penalty, solved, first solve, pending, attempts tooltip, you) to `web/messages/en.json` and `web/messages/br.json`; remove unused keys

## 5. Export

- [x] 5.1 Add an RFC 4180 `toCsv(rows)` helper (quote every field, double embedded quotes) and expose a shared "counted in standings" predicate from `standings.ts`
- [x] 5.2 Build `standings.csv` from `computeStandings`: rank, name, username, email, solved, penalty, per-letter `attempts/minute`, total submissions, pass rate
- [x] 5.3 Query contest submissions joined with user and problem title; build `submissions.csv` ordered by `createdAt` with all columns from the spec (output truncated ~2 KB, code file path)
- [x] 5.4 Add/reuse a `Language → file extension` map and write each submission's code to `code/<username>/<letter>-<seq>-<status>.<ext>`
- [x] 5.5 Assemble the ZIP with `jszip` in `exportContestData` (owner-only check kept) and return it base64-encoded
- [x] 5.6 Update `tabs/management/export.tsx` to decode and download `<contest-slug>-export.zip`; update export button/description strings in `en.json` and `br.json`

## 6. Verification

- [x] 6.1 `cd web && npx tsc --noEmit` and `npm run lint` pass
- [ ] 6.2 Run the app, open a running contest leaderboard as participant, owner, and non-member of a private contest; confirm ranking, cells, highlight, polling (network tab), and access denial
- [ ] 6.3 Export the ZIP; confirm `standings.csv` order/values match the leaderboard, `submissions.csv` has one row per submission (late ones flagged not counted), code files open with correct extensions, and a name containing `,` and `"` parses as one field
