## 1. Schema & sync

- [ ] 1.1 Add `problemConstraint`-style Drizzle table(s) (`web/drizzle/schemas/`): structural rules (rule type + params, per problem, many) and at most one algorithm-requirement description per problem.
- [ ] 1.2 Add `CONSTRAINT_VIOLATION` and `PENDING_CONSTRAINT_CLASSIFICATION` variants to the Drizzle `submission_status` enum; generate + apply migration.
- [ ] 1.3 Add matching variants to `judge/src/models.rs`'s `SubmissionStatus` Rust enum, keeping `#[sqlx(...)]` label mapping in sync with the Drizzle enum per root `CLAUDE.md`.

## 2. Constraint authoring (web)

- [ ] 2.1 Server actions to create/update/delete structural constraints and the single algorithm-requirement constraint on a problem, scoped to the problem's creator.
- [ ] 2.2 Edit workspace UI: constraint catalog picker (loop-nesting depth, forbidden constructs, etc.) with parameter inputs, plus algorithm-requirement text field, wired through React Query hooks per existing mutation-cache-invalidation conventions.
- [ ] 2.3 Enforce single-algorithm-requirement-per-problem validation server-side.

## 3. Judge-side structural static analysis

- [ ] 3.1 New judge module for structural static analysis, per submission language, starting with the v1 rule catalog (max loop nesting depth, forbidden constructs/builtins).
- [ ] 3.2 Wire into `process_job()`: after a submission passes all test cases, if the problem has structural constraints, run analysis against the submitted source before finalizing status.
- [ ] 3.3 On structural violation, write `CONSTRAINT_VIOLATION` status + which rule was violated into the `JudgeReport`/DB, skipping any algorithm-requirement classification step.
- [ ] 3.4 On structural pass (or no structural constraints), continue to step 4 if an algorithm-requirement constraint is active, else finalize `PASSED` as today.

## 4. AI algorithm-requirement classification (web)

- [ ] 4.1 Judge writes `PENDING_CONSTRAINT_CLASSIFICATION` (instead of `PASSED`) when I/O + structural checks pass and an algorithm-requirement constraint is active.
- [ ] 4.2 Web-side mechanism to pick up `PENDING_CONSTRAINT_CLASSIFICATION` submissions (poll or notify, following the existing `pg_notify`/React Query polling patterns already used for submission status).
- [ ] 4.3 Server action calling Gemini with the problem's algorithm-requirement description + submitted source, structured JSON output (satisfied: bool, rationale: string), following the `reviewProblem`/`getAIHelp` pattern.
- [ ] 4.4 Write final verdict back: `PASSED` if satisfied, `CONSTRAINT_VIOLATION` + rationale if not.

## 5. Leaderboard/credit integration

- [ ] 5.1 Update `db.rs`'s `update_submission_result` (or its web-side equivalent for the async classification path) so `CONSTRAINT_VIOLATION` never writes `user_on_contest.answered` leaderboard credit.
- [ ] 5.2 Audit other places that switch on `submission.status` (submission history UI, contest management views, contest exports) to handle the two new statuses explicitly rather than falling through.

## 6. Reference-solution validation integration

- [ ] 6.1 Extend `problemValidation` run execution to check active solution constraints against the reference solution (structural in judge, algorithm-requirement via the same web-side classification action), reusing task-4 machinery.
- [ ] 6.2 Extend `problemValidation`'s staleness content-hash to also cover the problem's current solution constraints, so editing constraints after a pass re-blocks publish per the modified `problem-io-validation` spec.
- [ ] 6.3 Update validation results UI to show per-constraint pass/fail alongside per-test-case results.

## 7. Submission result UI

- [ ] 7.1 Render `CONSTRAINT_VIOLATION` distinctly from `PASSED`/`FAILED`/`ERROR` in submission result views, showing which structural rule or algorithm-requirement was violated (with AI rationale when applicable).
- [ ] 7.2 Render `PENDING_CONSTRAINT_CLASSIFICATION` as a distinct in-progress state (not shown as passed) while classification is outstanding.

## 8. Verification

- [ ] 8.1 Judge-side unit tests for structural static analysis per rule type and per language.
- [ ] 8.2 End-to-end pass through: submission with I/O pass + structural pass + no algorithm requirement → `PASSED` unchanged from current behavior (regression check).
- [ ] 8.3 End-to-end pass through: submission violating a structural rule → `CONSTRAINT_VIOLATION`, no leaderboard credit.
- [ ] 8.4 End-to-end pass through: submission with algorithm-requirement constraint, both satisfied and violated classification outcomes.
- [ ] 8.5 Validation run against a reference solution that violates a constraint blocks publish per staleness rules.
