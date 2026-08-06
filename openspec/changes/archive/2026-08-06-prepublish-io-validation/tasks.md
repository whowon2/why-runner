## 1. Schema

- [x] 1.1 Add `problemValidation` Drizzle schema (`web/drizzle/schemas/`): problemId (FK → problem), reference solution code, language, status (`PENDING|PASSED|FAILED|ERROR`), per-test results (input/output/actual/passed), ioHash (content hash of the input/output pairs it ran against), createdAt/updatedAt
- [x] 1.2 Add reference solution code + language columns to `problem` (or a 1:1 side table) so the reference solution persists with the draft independent of any single validation run
- [x] 1.3 Generate and review migration (`bun db:generate`)

## 2. Server actions

- [x] 2.1 Action to save/update a draft's reference solution (code + language)
- [x] 2.2 Action to trigger a validation run: reject if no reference solution, reject if zero test cases, reject if caller isn't the problem's creator; otherwise compute ioHash, insert `problemValidation` row with status `PENDING`, `pg_notify('new_validation', id)`
- [x] 2.3 Action/query to fetch current validation state for a problem: latest run's status/per-test results, plus whether its ioHash matches the problem's current input/output hash (stale check)
- [x] 2.4 Modify `publishProblem` to additionally require a `problemValidation` row with status `PASSED` and `ioHash` matching current I/O; return a distinct "validation required" failure reason alongside existing field-emptiness reasons

## 3. Hooks (React Query)

- [x] 3.1 `use-trigger-validation` mutation hook
- [x] 3.2 `use-problem-validation` query hook, polling while status is `PENDING`/`RUNNING` (mirror existing submission-polling pattern in `hooks/`)
- [x] 3.3 Invalidate the validation query whenever the draft's I/O is saved (per `mutation-cache-invalidation` conventions)

## 4. UI (problem edit workspace)

- [x] 4.1 Reference solution input: code editor/textarea + language select, in `problems/_components/workspace/edit.tsx` or a new sub-section
- [x] 4.2 "Validate" button: disabled state + reasons (no reference solution / no test cases), pending/loading state while judge runs it
- [x] 4.3 Per-test result display: pass/fail per input/output pair, expected vs actual output on mismatch, distinct error state for compile/timeout/resource errors
- [x] 4.4 Stale-validation indicator: shown when the latest passing run's ioHash no longer matches current I/O; prompts re-validation
- [x] 4.5 Gate the existing Publish button on a fresh passing validation; surface the "validation required"/"stale" reason inline, consistent with how existing missing-field reasons are shown

## 5. Judge (separate repo, `judge/`) — contract handoff

- [x] 5.1 Add `problemValidation`-equivalent struct to `judge/src/models.rs`, hand-synced with the new Drizzle schema (per existing web/judge sync convention)
- [x] 5.2 Add `LISTEN new_validation` alongside existing `new_submission` listener in `judge/src/main.rs`
- [x] 5.3 Add periodic sweep fallback over `problemValidation WHERE status = 'PENDING'`, mirroring the existing submission sweep
- [x] 5.4 Reuse existing sandboxed execution/grading core to run the reference solution against the validation row's input/output pairs and write per-test results + final status back

## 6. Verification

- [x] 6.1 Confirm a validation run never appears in leaderboard queries, `get-user-submissions`, `get-submissions`, or contest exports (spot-check each read site pulls only from `submission`)
- [x] 6.2 Manual pass: create draft → add I/O → validate with a correct reference solution → publish succeeds
- [x] 6.3 Manual pass: validate with a reference solution producing wrong output on one test case → publish blocked, mismatch shown
- [x] 6.4 Manual pass: validate successfully, then edit an input → stale indicator appears, publish blocked until re-validated
- [x] 6.5 Confirm bulk import (`importProblems`) is unaffected — still publishes directly without a validation run
