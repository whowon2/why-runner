## Context

Execution today exists only as grading. Web inserts a `PENDING` `submission` (or `problem_validation`) row and calls `notifyJudge()` (`web/lib/judge.ts`): `pg_notify` for a running judge plus a Fly Machines start for one that idle-exited. The judge (`judge/src/main.rs`) drains submissions, then validations, through `grade()`: `runner::prepare` (compile once) → `runner::execute` per test (fresh isolate box) → compare → `JudgeReport` JSON. `update_submission_result` is the only writer of contest standings.

`submission` rows are read all over web: rate limits, gradebook, completion, problem statistics, similarity, AI help, leaderboard, activity. Any ungraded row there would need a filter in every one of those queries.

Constraints: Fly runs `shared-cpu-1x` with `JUDGE_CONCURRENCY=1`, idle auto-stop, manual `fly deploy`; web deploys on push to Vercel; the two must agree on DB enums (`scripts/check-enum-sync.ts` in CI).

## Goals / Non-Goals

**Goals:**
- Ungraded single execution with user stdin from the three code editors (and blocks exercises).
- Zero change to grading semantics and to every existing `submission` query.
- Same sandbox and limits as grading, so "it ran fine" means the same thing in Run and Submit.
- Bounded cost: rate limit, one in-flight run, input/output caps, 24 h retention.
- Safe rollout across two independently deployed services.

**Non-Goals:**
- Run against the problem's sample tests with comparison ("Run examples"). Could follow later, but only over visible tests.
- Interactive stdin, streaming output, or multiple files.
- Parsons exercises (the student only reorders given lines; Run adds little there and would mostly brute-force ordering).
- Run history UI: only the latest run per editor is shown.
- Enforcing `problem.memory_limit_mb`: the judge does not enforce it for grading today (language caps only), and runs mirror grading.
- Fixing the pre-existing unbounded read of piped stdout in `isolate.rs` for grading.

## Decisions

### 1. Separate `code_run` table + `new_run` channel, not a `submission.kind` column

A `kind` column would need `kind = 'submission'` added to every existing submission query (rate limit, gradebook, completion, statistics, similarity, standings, AI help, exports), and one missed filter leaks runs into grades. The judge's `get_next_submission` / `update_submission_result` would also need to branch, touching the grading path. A separate table keeps all of that untouched; the cost is a few small new queries.

```
code_run
  id uuid pk, user_id text → user (cascade), problem_id uuid → problem (cascade)
  contest_id uuid null → contest (cascade), exercise_id uuid null → exercise (cascade)
  language language, code text, stdin text
  status code_run_status default 'PENDING'
  stdout text, stderr text, stdout_truncated bool, stderr_truncated bool
  exit_code int null, runtime_ms int null, memory_kb int null
  created_at, updated_at timestamptz
  index (user_id, created_at), index (status, created_at)
```

`contest_id`/`exercise_id` are kept for auditing and to let the contest policy be checked; the judge only needs `code`, `language`, `stdin`, `problem_id`.

### 2. Own status enum `code_run_status`

`PENDING, RUNNING, OK, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED, COMPILATION_ERROR, ERROR`. Reusing `submission_status` would surface `PASSED`/`WRONG_ANSWER`, which imply grading. Adding values to `submission_status` would touch the grading enum for no reason. The new enum gets a Rust `CodeRunStatus` with `rename_all = "SCREAMING_SNAKE_CASE"` (or explicit renames) and is added to `REQUIRED` in `check-enum-sync.ts`.

### 3. Judge: claim order submissions → runs → validations

`run_next_job` tries `get_next_submission`, then `get_next_run`, then `get_next_validation`. Grading keeps priority (contest fairness); runs come before validations because a student is waiting on screen. With one worker a run can wait behind a burst of submissions; acceptable at classroom scale, revisit with fair interleaving if needed.

`process_run_job`: `db.get_problem_time_limit(problem_id)` (a new query selecting only `time_limit_ms`, never `inputs`/`outputs`/checker), then `runner::prepare(code, language)`, then one `runner::execute(prepared, stdin, time_limit_secs(language, ms))`. Status mapping reuses grading's rules: compile failure → `COMPILATION_ERROR` (compiler stderr), `is_internal_error` → `ERROR`, `is_timeout` → `TIME_LIMIT_EXCEEDED`, failed + `is_memory_limit` → `MEMORY_LIMIT_EXCEEDED`, other non-zero exit → `RUNTIME_ERROR`, else `OK`. `grade()`, `process_job()` and `judge_test_case()` are not modified; at most a small pure helper for the status mapping is extracted next to them, unit-tested on a bare host.

Claim query: same `UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1)` shape, `PENDING` only, no retry budget (like validations: a lost run is re-clicked). The dispatcher sweep also runs `reap_stale_runs` (`RUNNING` > 2 min → `ERROR`, "judge restarted") and `prune_old_runs` (`created_at < now() - 24h` → delete). `has_claimable_jobs` adds `EXISTS (SELECT 1 FROM code_run WHERE status = 'PENDING')`. The dispatcher `LISTEN`s on `new_run` too.

### 4. Output cap at storage time

The judge truncates stdout and stderr to 64 KiB each (on a UTF-8 char boundary) before writing, setting `*_truncated`. This bounds DB rows and the payload sent to the browser. The judge process itself still reads the whole pipe, as grading does today; the CPU/wall limits bound how much a program can print. Noted as a risk, not fixed here (Non-Goals).

### 5. Web action and access checks

`lib/actions/runs/create-run.ts` (`"use server"`), input parsed with zod as a discriminated union on `context`:

- `{ context: "problem", problemId, code, language, stdin }` — same visibility check as `createProblemSubmission` (published, or owner/admin for drafts).
- `{ context: "contest", contestId, problemId, code, language, stdin }` — same checks as `createSubmission` (published, started, accepted participant, problem attached) plus `contest.allowRuns`; no "already answered" check.
- `{ context: "exercise", exerciseId, mode: "code" | "blocks", … , stdin }` — `assertClassMember`; mode must equal `exercise.mode`; `blocks` regenerates Portugol server-side exactly as `createExerciseSubmission` does (extract that block into a shared helper rather than copy it); no due-date check.

Order: `CUSTOM_RUN_ENABLED` gate → auth → zod → size limits (`MAX_RUN_STDIN = 64 KiB` in `lib/submission-limits.ts`, existing `MAX_CODE_LENGTH`) → rate limit (count `code_run` rows by user in last 60 s ≥ 10 → `RATE_LIMITED`) → in-flight check (`PENDING`/`RUNNING` younger than 2 min → `RUN_IN_PROGRESS`) → access → insert only listed fields → `notifyJudge("new_run", id)` → return `{ id }`.

The rate-limit count and insert are not in one transaction; a burst can slip one or two extra runs past the limit, same as the submission limiter today. The in-flight check makes that negligible.

`lib/actions/runs/get-run.ts`: by id, `where id = $1 and user_id = currentUser`, returns only the result columns (no `code`). Hooks: `useCreateRun` (mutation, sets the latest run id; invalidates nothing else since runs feed no other view — checked against the mutation-cache-invalidation skill) and `useRun(id)` polling every 1 s while `PENDING`/`RUNNING`, like `useProblemValidation`.

### 6. Shared UI component

`components/code-run/run-panel.tsx`: a collapsible "Input" textarea (monospace, 64 KiB `maxLength`) and a result area (status badge with localized labels under a new `CodeRunStatus` namespace, exit code, time, memory, stdout/stderr blocks with copy, truncation notes). A `RunButton` (Play icon, `variant="outline"`) goes into each editor's toolbar next to Submit; the panel sits under the editor. The editor owns the code; the panel takes `getProgram()` returning the create-run input (minus `stdin`). Wired into `problems/_components/workspace/submit.tsx`, `contests/_components/tabs/problem/upload.tsx`, and `classes/_components/exercise-detail.tsx` (`ExerciseSubmit`, `BlocksSubmit`). Visibility comes from `useRunsEnabled()` (a `getRunsEnabled` server action reading the env gate, cached for the session), plus `contest.allowRuns` for contests. On the problem page the runner state is lifted into the workspace, since Radix unmounts inactive tabs. Prefill: lesson exercises use the first visible test input (already rendered in their Test cases card); the problem and contest editors start empty, since their examples load in another tab/component.

Portugol hint: the panel notes that Portugol input is read one token per line (same normalization as grading).

### 7. Rollout gate by env var, not feature detection

The judge is idle-stopped, so web cannot ask it what it supports without waking it, and a heartbeat table would add moving parts. `CUSTOM_RUN_ENABLED` (server env in `env.ts`, default off) gates both the UI flag and the action. Deploy: merge → CI pushes judge image → `fly deploy -a why-runner-judge` (logs show `v1.1.0`) → set `CUSTOM_RUN_ENABLED=true` on Vercel → redeploy. The migration is additive, so the old judge keeps grading normally between migrate and deploy.

### 8. Versions and enum sync

`judge/Cargo.toml` 1.1.0, `web/package.json` 1.2.0 (minor: new feature, additive DB contract). `check-enum-sync.ts` gains `code_run_status` in `REQUIRED`.

## Risks / Trade-offs

- [Runs share the single Fly worker with grading] → submissions keep priority; one in-flight run per user and 10/min cap the load; runs are one execution vs N tests per submission.
- [Runs make the judge wake more often (Fly cost)] → same idle auto-stop; runs are short. Monitor `fly logs` after the first class.
- [A program printing in a tight loop until TLE fills judge memory through the pipe] → pre-existing for grading; bounded by wall time; storage capped at 64 KiB. Follow-up: isolate `--stdout` to a file plus `--fsize`, for both paths.
- [Students brute-force hidden tests with Run] → Run never sees tests; it only gives what local execution would. Contest creators can turn it off.
- [Web deployed with the gate on before the judge] → runs stay `PENDING`; after 2 min they block nothing (in-flight check ignores them) and the panel shows "still waiting". Fix by deploying the judge; the new judge drains them.
- [Migration numbering collision with a parallel branch] → `fix/survey-feedback` adds no migration; re-check `web/drizzle/migrations/` before merging.

## Migration Plan

1. `0052_code_run.sql` (generated by `bun db:generate`): create `code_run_status`, `code_run` with indexes, `ALTER TABLE contest ADD COLUMN allow_runs boolean DEFAULT true NOT NULL`. Additive only.
2. Merge PR → CI tags `judge-v1.1.0`/`web-v1.2.0`, pushes judge image.
3. `fly deploy -a why-runner-judge`; confirm `WhyRunner judge v1.1.0` in `fly logs`.
4. Set `CUSTOM_RUN_ENABLED=true` on Vercel production and redeploy.

Rollback: unset `CUSTOM_RUN_ENABLED` (hides Run immediately). The judge and table can stay; dropping them is not needed.

## Open Questions

- Should runs keep priority over submissions during lessons (no contest fairness concern)? Default: no, submissions first everywhere.
- Prefill the input box with the first visible example? Default: yes where the page already shows examples.
