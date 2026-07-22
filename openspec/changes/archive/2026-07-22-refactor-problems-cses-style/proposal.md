## Why

Problems list page (`web/app/[locale]/problems/_components/list.tsx`) is a bare flex list with no success-rate signal and no per-user solved status — user can't tell what's worth attempting or what they already cleared. The standalone problem page (`web/app/[locale]/problems/[slug]/page.tsx`) only shows the description; submit/results/statistics/tests UI currently only exists inside the contest flow (`contests/_components/tabs/problem/*`), so a problem can't be practiced outside a contest. CSES-style tabbed layout (task/submit/results/statistics/tests) is a proven UX for this and reuses components (`ui/tabs.tsx`, `ui/table.tsx`) already in the codebase.

## What Changes

- Replace the problems list flex layout with a table: columns for problem name, solved-by count (success count), and a solved/unsolved indicator for the current user.
- Replace the standalone problem page with a CSES-style tabbed workspace with 5 tabs:
  - **Task**: existing description/examples content + a Time limit / Memory limit line.
  - **Submit**: language select + code file upload (reuse `UploadCode` pattern from contest flow, but submit outside contest context, i.e. `contestId = null`).
  - **Results**: table of the current user's submissions to this problem (time/runtime, language, code size in characters, result), with a details button/dialog per row showing status detail, raw test results, submitted code, and input/output for failing case.
  - **Statistics**: solved-by / attempted-by / success-rate summary for the problem (CSES "Task summary" style).
  - **Tests**: list/download of the problem's test cases.
- **BREAKING**: `submission` table gains non-null-safe new columns (`runtimeMs`, `memoryKb`, `codeSize`) — existing rows backfilled to `NULL`; judge must start populating them going forward for `Results`/`Statistics` accuracy (see Impact).
- `problem` table gains `timeLimitMs` and `memoryLimitMb` columns (defaulted for existing rows) so limits can be shown on Task/Statistics tabs.
- New server action(s) to fetch: per-problem solved-count/attempted-count/success-rate, per-user solved status for each row in the list, and a non-contest-scoped submission history for a problem.

## Capabilities

### New Capabilities
- `problem-list-view`: table-based problems list showing name, solved-by count, and current user's solved status, with existing search/difficulty/pagination filters preserved.
- `problem-workspace`: tabbed standalone problem page (Task / Submit / Results / Statistics / Tests), including non-contest submission creation and per-user submission history with a details view.

### Modified Capabilities
(none — no existing `openspec/specs/` capability currently covers problems browsing or the problem detail page)

## Impact

- `web/app/[locale]/problems/_components/list.tsx` — rewrite as a table component.
- `web/lib/actions/problems/get-problems.ts` — extend query to include solved-by count and per-user solved flag (or add a companion action).
- `web/app/[locale]/problems/[slug]/page.tsx` and `_components/description.tsx` — replaced/wrapped by new tabbed workspace component.
- New components under `web/app/[locale]/problems/_components/` for tabs, submit form, results table, statistics panel, tests panel (can adapt `contests/_components/tabs/problem/*`).
- `web/lib/actions/problems/` — new actions for problem statistics and non-contest submission history; `web/lib/actions/submissions/` (wherever `useCreateSubmission` posts) needs to allow `contestId: null`.
- `web/drizzle/schemas/problems.ts` — add `timeLimitMs`, `memoryLimitMb` columns + migration.
- `web/drizzle/schemas/submissions.ts` — add `runtimeMs`, `memoryKb`, `codeSize` columns + migration.
- `judge/src/models.rs` / judge write-back path — must populate the new runtime/memory columns on submission completion (kept in sync per root `CLAUDE.md` schema-sync note); `codeSize` can be computed web-side at submit time instead.
