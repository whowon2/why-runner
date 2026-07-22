## 1. Schema & Migrations

- [x] 1.1 Add `timeLimitMs` (default 1000) and `memoryLimitMb` (default 512) columns to `problem` in `web/drizzle/schemas/problems.ts`
- [x] 1.2 Add `runtimeMs` (nullable), `memoryKb` (nullable), `codeSize` (nullable, backfilled via `length(code)`) columns to `submission` in `web/drizzle/schemas/submissions.ts`
- [x] 1.3 Generate and review Drizzle migration for the above
- [x] 1.4 Confirm `submission.contestId` is nullable at the DB level for non-contest submissions

## 2. Server Actions

- [x] 2.1 Extend `web/lib/actions/problems/get-problems.ts` (or add a companion action) to return, per problem on the current page, solved-by count and whether the current user solved it
- [x] 2.2 Add `getProblemStatistics(problemId)` action returning solved-by count, attempted-by count, success rate, time limit, memory limit
- [x] 2.3 Add `getProblemSubmissions(problemId, userId)` action returning the current user's own submissions for a problem (no contest scoping), including runtime, language, code size, status (already existed at `lib/actions/problems/get-submissions.ts`, unused until now — reused as-is)
- [x] 2.4 Ensure submission-creation action/hook (`useCreateSubmission` path) accepts `contestId: null` and sets `codeSize = code.length` at submit time (new `createProblemSubmission` action + `useCreateProblemSubmission` hook, kept separate from contest flow per design)
- [x] 2.5 Add an action to fetch a problem's full test-case set (input/output pairs) for download as an archive, gated on the requesting user having a `PASSED` submission for that problem

## 3. Problems List Page

- [x] 3.1 Rewrite `web/app/[locale]/problems/_components/list.tsx` to render `ui/table.tsx` with columns: name, solved-by count, solved indicator
- [x] 3.2 Wire the table to the extended `getProblems`/companion action from 2.1
- [x] 3.3 Preserve existing search/difficulty/"my problems"/pagination behavior against the new table

## 4. Problem Workspace Page

- [x] 4.1 Replace `web/app/[locale]/problems/[slug]/page.tsx` content with a tabbed workspace using `ui/tabs.tsx`, URL-synced tab state (pattern from `contests/_components/tabs/index.tsx`)
- [x] 4.2 Task tab: reuse `ProblemDescription`/`ProblemExamples`, add time limit / memory limit display from 2.2
- [x] 4.3 Submit tab: adapt `UploadCode` (from `contests/_components/tabs/problem/upload.tsx`) for non-contest submission (`contestId: null`)
- [x] 4.4 Results tab: table (time, language, code size, result) built from `getProblemSubmissions`, sorted most-recent-first
- [x] 4.5 Results tab: submission details dialog showing status detail, raw test results, submitted code, input/output for the relevant case (adapt parsing logic from `contests/_components/tabs/problem/submission-list.tsx`)
- [x] 4.6 Statistics tab: render solved-by/attempted-by/success-rate from `getProblemStatistics`, CSES "Task summary" style
- [x] 4.7 Tests tab: list sample test cases (input/output) for everyone; if current user has solved the problem, also list all test cases and enable a download-all-as-zip control; otherwise show samples only with download locked

## 5. Judge Write-back

- [x] 5.1 Update `judge/src/models.rs` and submission write-back path to populate `runtime_ms` / `memory_kb` on grading completion (real wall-clock `runtime_ms`; `memory_kb` via periodic `docker stats` sampling of a named, non-`--rm` container — approximation, not a true cgroup peak counter, see comment in `runner.rs`)
- [x] 5.2 Verify judge's `Language`/`SubmissionStatus` enums remain in sync with Drizzle enums after schema changes, per root `CLAUDE.md` (unchanged — new columns are plain `integer`/nullable, no new Postgres enum values added on either side)

## 6. Verification

- [ ] 6.1 Manually test: browse problems list table, confirm solved indicator toggles after solving a problem
- [ ] 6.2 Manually test: submit a solution from the Submit tab outside any contest, confirm it grades and appears in Results
- [ ] 6.3 Manually test: Statistics tab numbers match manual count of PASSED submissions for a sample problem
- [ ] 6.4 Manually test: Tests tab download produces a valid archive of sample test cases
- [ ] 6.5 Confirm contest-scoped submit/results flow (`contests/_components/tabs/problem/*`) is unaffected
