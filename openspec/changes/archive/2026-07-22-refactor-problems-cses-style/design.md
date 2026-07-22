## Context

Problems list (`web/app/[locale]/problems/_components/list.tsx`) is a flex row list driven by `getProblems` (`web/lib/actions/problems/get-problems.ts`), which queries `problem` with search/difficulty/pagination but no aggregate stats. Standalone problem page (`web/app/[locale]/problems/[slug]/page.tsx`) renders only `ProblemDescription` — submit/results UI (`UploadCode`, `SubmissionList`, both under `contests/_components/tabs/problem/`) exist only inside the contest flow and are hard-coupled to `contestId`. `submission` schema (`web/drizzle/schemas/submissions.ts`) has no runtime/memory/code-size columns; `problem` schema has no time/memory limit columns. Judge (`judge/`) writes submission results back via Postgres per root `CLAUDE.md`; its `Language`/`SubmissionStatus` enums must stay hand-synced with Drizzle's.

## Goals / Non-Goals

**Goals:**
- Table-based problems list with solved-by count and per-user solved indicator.
- Standalone, non-contest problem workspace with 5 tabs (Task/Submit/Results/Statistics/Tests), matching CSES layout/behavior.
- Submissions made outside a contest (`contestId = null`) work end-to-end through the existing judge pipeline unchanged.
- Time limit / memory limit surfaced on Task and Statistics tabs.

**Non-Goals:**
- No change to contest-scoped submission flow (`contests/_components/tabs/problem/*` stays as-is; new problem-workspace components are separate, not a shared refactor of both call sites in this change).
- No change to judge sandboxing/grading logic itself — only which columns it writes back.
- No per-test-case pass/fail breakdown beyond what judge's existing `output` JSON already encodes (Results detail view parses existing `output`, doesn't request new judge capabilities beyond runtime/memory).
- Test case visibility for unsolved users is unchanged (samples only, per `exampleCount`) — only the newly-added "full set after solving" behavior is new (see Decisions).

## Decisions

- **Reuse `ui/tabs.tsx` with URL-synced tabs** (same pattern as `contests/_components/tabs/index.tsx`) so tab state is shareable/bookmarkable and back/forward works, instead of local `useState`.
- **New non-contest submission action** rather than relaxing `getContestSubmissions`/`useCreateSubmission` to silently accept a missing contest: add `getProblemSubmissions(problemId, userId)` and reuse existing `useCreateSubmission` (it already accepts `contestId?: string | null` at the DB level — confirm `submission.contestId` is nullable) so contest and non-contest paths stay explicit rather than magic-null-detected in shared code.
- **Solved-by/attempted-by/success-rate computed in SQL aggregate in the list/statistics actions**, not cached counters on `problem`, to avoid a denormalized-count sync bug (matches current codebase's action-per-query style; revisit only if this becomes a hot path).
- **`codeSize` computed web-side at submit time** (`code.length` in characters, matching the CSES "ch." unit) rather than round-tripped from judge, since it's derivable from data web already has and needs no judge change.
- **`runtimeMs`/`memoryKb` populated by judge**, not web, since only judge observes actual execution — this is the one place judge write-back changes; column added nullable so old rows and any in-flight submissions during deploy don't break.
- **Problems list table reuses `ui/table.tsx`** (already used in `contests/_components/tabs/management/submissions.tsx`) rather than introducing a new data-table library.
- **Full test-case set (not just samples) is gated on the viewer having a `PASSED` submission for that problem** — mirrors CSES's model where solving unlocks all tests; checked via the same solved-status query used by the list/statistics views, no new column needed.

## Risks / Trade-offs

- [New `problem`/`submission` columns require a DB migration] → additive nullable/defaulted columns only, no backfill computation needed beyond defaults; safe to deploy web before judge picks up writing `runtimeMs`/`memoryKb` (columns just stay NULL until judge is updated).
- [Judge and web schema drift further if judge isn't updated promptly] → tracked explicitly in tasks.md as a judge-side task, not deferred silently, per root `CLAUDE.md`'s manual-sync warning.
- [Success-rate/solved-count aggregate queries add load to the list page, which is already paginated/filtered] → aggregate only over the current page's problem IDs (not the whole table) when computing per-row counts.
- [Reusing `UploadCode`/`SubmissionList` contest components by copy-paste duplicates logic] → acceptable for this change (Non-Goal: no shared refactor); flag as follow-up cleanup once both flows are stable.

## Migration Plan

1. Add Drizzle migration: `problem.timeLimitMs` (default e.g. 1000), `problem.memoryLimitMb` (default e.g. 512), `submission.runtimeMs` (nullable), `submission.memoryKb` (nullable), `submission.codeSize` (nullable, backfillable via `length(code)` in the migration itself since it's cheap and deterministic).
2. Ship web changes (list table, tabs, actions) — `runtimeMs`/`memoryKb` render as "—" until judge populates them.
3. Update `judge/src/models.rs` and its DB write-back path to set `runtime_ms`/`memory_kb` on submission completion; update Rust enums/columns to match new Drizzle columns per the manual-sync convention.
4. No rollback complexity beyond standard migration-down (drop columns) since nothing else depends on them yet.

## Open Questions

- (resolved — see Decisions: full test-case set + download unlocked only after the viewer has a `PASSED` submission for the problem; samples-only otherwise)
- Exact memory/runtime units judge should write (`memoryKb` vs `memoryMb`) — chosen KB for precision on small test cases; confirm against what judge's sandbox actually reports.
