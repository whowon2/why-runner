## 1. Database

- [x] 1.1 Add `web/drizzle/schemas/code-runs.ts`: `CodeRunStatus` pgEnum (`code_run_status`: PENDING, RUNNING, OK, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED, COMPILATION_ERROR, ERROR) and `codeRun` table per design §1 with `(user_id, created_at)` and `(status, created_at)` indexes; export from `drizzle/schema`
- [x] 1.2 Add `allowRuns: boolean("allow_runs").default(true).notNull()` to `contest` in `drizzle/schemas/contests.ts`
- [x] 1.3 Check `web/drizzle/migrations/` is still at 0051 (and that `fix/survey-feedback` added none), then `bun db:generate` → `0052_code_run.sql`; review it is additive only; `bun db:migrate` locally
- [x] 1.4 Add `code_run_status` to `REQUIRED` in `scripts/check-enum-sync.ts`

## 2. Judge

- [x] 2.1 `models.rs`: `CodeRunStatus` (`sqlx` type `code_run_status`, labels matching Drizzle) and `CodeRun` row (`id, code, language, problem_id, stdin`)
- [x] 2.2 `db.rs`: `get_next_run` (atomic PENDING claim, no retries), `get_problem_time_limit` (only `time_limit_ms`), `update_run_result`, `reap_stale_runs` (RUNNING > 2 min → ERROR), `prune_old_runs` (> 24 h → delete); add pending runs to `has_claimable_jobs`
- [x] 2.3 Pure helpers + unit tests (bare host): status mapping from `ExecutionResult`/compile failure to `CodeRunStatus`, and `truncate_output(s, 64 KiB) -> (String, bool)` on a char boundary
- [x] 2.4 `main.rs`: `LISTEN new_run`; `run_next_job` order submissions → runs → validations; `process_run_job` (prepare once, execute once with `time_limit_secs`, map, truncate, save); call reap + prune in the dispatcher sweep. Leave `grade`/`process_job` unchanged
- [x] 2.5 `grade_tests`-style sandboxed tests for runs: OK with stdin echo, compile error, TLE, runtime error, Portugol input normalization; run the full suite in the isolate container (judge/CLAUDE.md command)
- [x] 2.6 `cargo fmt`, `cargo clippy`; bump `judge/Cargo.toml` to 1.1.0 (and `Cargo.lock`)

## 3. Web server side

- [x] 3.1 `env.ts`: `CUSTOM_RUN_ENABLED` (server, boolean, default false); document in `web/CLAUDE.md` env list
- [x] 3.2 `lib/judge.ts`: add `"new_run"` to `JudgeChannel`
- [x] 3.3 `lib/submission-limits.ts`: `MAX_RUN_STDIN = 64 * 1024`, run rate-limit constants
- [x] 3.4 Extract the blocks → Portugol program builder from `createExerciseSubmission` into a shared server-only helper; use it in both actions
- [x] 3.5 `lib/actions/runs/create-run.ts`: gate, auth, zod union (problem/contest/exercise), size limits, rate limit, in-flight check, per-context access checks incl. `contest.allowRuns`, insert listed fields, `notifyJudge("new_run", id)`; errors `RUNS_DISABLED | RATE_LIMITED | RUN_IN_PROGRESS | INPUT_TOO_LARGE | CODE_TOO_LARGE | CONTEST_NOT_STARTED`
- [x] 3.6 `lib/actions/runs/get-run.ts`: owner-only, result columns only
- [x] 3.7 Expose `runsEnabled` to the three editors: `getRunsEnabled` action + `useRunsEnabled` hook (env gate), `&& contest.allowRuns` for contests
- [x] 3.8 Contest settings: `allowRuns` in the settings form schema, `update-contest` zod schema and its explicit `.set` fields

## 4. Web UI

- [x] 4.1 Hooks `hooks/use-create-run.tsx` (mutation) and `hooks/use-run.tsx` (poll 1 s while PENDING/RUNNING), following the mutation-cache-invalidation skill
- [x] 4.2 `components/code-run/`: `RunButton` and `RunPanel` (input textarea, status badge, exit code, time, memory, stdout/stderr with copy, truncated notes, pending state, Portugol hint)
- [x] 4.3 Wire into problem workspace `submit.tsx`, contest `upload.tsx`, and `exercise-detail.tsx` (`ExerciseSubmit`, `BlocksSubmit`; not Parsons), hidden when `runsEnabled` is false
- [x] 4.4 Optional prefill of the input with the first example input already rendered on the page
- [x] 4.5 "Allow custom runs" switch in the contest Settings form
- [x] 4.6 i18n in `messages/br.json` and `messages/en.json`: Run labels, `CodeRunStatus` labels, action error codes, truncation and Portugol notes
- [x] 4.7 Bump `web/package.json` to 1.2.0 (1.1.0 taken by fix/survey-feedback); `bun lint`, `bun test lib`, `bun run build`

## 5. Verification

- [x] 5.1 Local stack with judge: run each language once with custom input from the problem workspace (student account)
- [ ] 5.2 Contest problem: run works; turn "Allow custom runs" off → button gone and direct action call returns `RUNS_DISABLED`; standings/submissions unchanged after runs
- [ ] 5.3 Lesson exercise (code + blocks): run works after the due date; gradebook/completion unchanged; Parsons shows no Run
- [ ] 5.4 Limits: 11th run in a minute → `RATE_LIMITED`; 2 concurrent → `RUN_IN_PROGRESS`; > 64 KiB stdin → `INPUT_TOO_LARGE`; 1 MB output → truncated note
- [ ] 5.5 `CUSTOM_RUN_ENABLED` unset → no Run button anywhere, action refuses
- [x] 5.6 `bun scripts/check-enum-sync.ts` passes

## 6. Docs and PR

- [x] 6.1 Update `web/CLAUDE.md` (custom runs section, `code_run`, env var) and `judge/CLAUDE.md` (run job, claim order, sweep, test counts)
- [x] 6.2 PR body: deploy order (judge `fly deploy` before setting `CUSTOM_RUN_ENABLED=true` on Vercel), migration 0052, rollback = unset the env var
- [x] 6.3 Draft entries for `docs/evaluation/post-evaluation-changes.md` and the slides/thesis (F6 resolved: what, why, limits, no grading effect)
