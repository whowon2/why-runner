## 1. Schema + migration 0048

- [x] 1.1 Add the five verdicts to `SubmissionStatus` in `web/drizzle/schemas/submissions.ts` (comment: FAILED legacy, ERROR = judge fault)
- [x] 1.2 Add `ProblemCompareMode` pg enum, `compareMode` (default `tokens`) and `floatEpsilon` (default 1e-6) to `problem`; add `problemChecker` table (problemId PK/FK cascade, language, code, updatedAt) + relation; export from `drizzle/schema`
- [x] 1.3 `bun db:generate`, rename/verify file is `0048_*`, hand-add `UPDATE problem SET compare_mode = 'exact'`; check journal/snapshot are consistent

## 2. Judge: models + pure logic

- [x] 2.1 `models.rs`: add verdict variants to `SubmissionStatus`; `CompareMode` enum; `Problem` gains `compare_mode`, `float_epsilon`, `checker_language: Option<Language>`, `checker_code: Option<String>`; `JudgeReport.verdict`
- [x] 2.2 `db.rs::get_problem`: select new columns with `LEFT JOIN problem_checker` (no other db.rs changes)
- [x] 2.3 New `compare.rs` with `exact`/`tokens`/`float` comparison + unit tests (bare-host runnable)
- [x] 2.4 `runner.rs`: `looks_like_memory_limit` pure fn + unit tests, `ExecutionResult.is_memory_limit`, `is_internal_error`; `execute_checker` for checker runs

## 3. Judge: grading

- [x] 3.1 `grade()`: per-test verdict classification (ERROR / TLE / MLE / RE / WA), compile failure → COMPILATION_ERROR, comparison via mode; set `report.verdict`
- [x] 3.2 Custom checker path: prepare checker once, run per successful test with input/output/answer files; exit 0/1/other mapping; checker compile failure / missing checker → ERROR
- [x] 3.3 `resolve_constraint_status` returns `report.verdict` for failures; validation keeps PASSED/FAILED
- [x] 3.4 Update existing `grade_tests` assertions + add tests for verdicts and checker (sandbox-only); `cargo build`, `cargo test compare runner::tests isolate::tests constraints::tests` on bare host; run sandboxed suite if Docker is available

## 4. Web: verdict display + logic

- [x] 4.1 `lib/submission-status.ts`: `REJECTED_STATUSES`, `isFinalFailure`, `statusTone`; unit test
- [x] 4.2 `components/submissions/status-badge.tsx` + `SubmissionStatus` labels in `messages/en.json` and `messages/br.json`
- [x] 4.3 Replace status rendering/colour maps in workspace `results.tsx`, contest `submission-list.tsx`, contest management `submissions.tsx`, classes `exercise-detail.tsx`; AI-help condition and exercise failure condition use `isFinalFailure`
- [x] 4.4 `notification-bell.tsx`: failed message for every final failure
- [x] 4.5 `lib/contest/standings.ts` `classifyStatus` + tests for new verdicts (CE ignored)
- [x] 4.6 `lib/judge-report.ts` type: optional `verdict`; show verdict in validation panel; mention verdict in `lib/prompt.ts` AI prompt
- [x] 4.7 Grep for any other status switches/`as const` lists (exports, home, stats) and update

## 5. Web: comparison settings

- [x] 5.1 `computeIoHash` takes optional comparison settings (only hashed when mode ≠ exact); update all callers (trigger/get validation, publish, exercise-mode)
- [x] 5.2 `updateProblem`: zod `compareMode`, `floatEpsilon` (0,1], `checker` {language ≠ portugol, code} | null; transaction updating problem + upsert/delete checker; reject checker mode without checker
- [x] 5.3 `get-problem-for-edit` returns checker (owner only); confirm student-facing queries never touch `problem_checker`
- [x] 5.4 Problem edit form (`create.tsx`): "Output comparison" section (mode select + help, ε input, checker language + code), i18n en/br
- [x] 5.5 Hook invalidation (mutation-cache-invalidation skill) for validation staleness after saving comparison settings

## 6. Docs + verification

- [x] 6.1 Update `judge/CLAUDE.md` (verdicts, compare modes, checker protocol) and `web/CLAUDE.md` (status list, problem compare fields)
- [x] 6.2 `bun lint`, `bunx tsc --noEmit`, `bun test lib`; `cargo fmt`, `cargo build`, bare-host tests
- [x] 6.3 Apply migration to local DB and smoke-test: submit WA/TLE/RE/CE in a problem, float mode, checker mode (judge rebuilt from this branch; all verdicts + checker verified end-to-end and in the UI)
