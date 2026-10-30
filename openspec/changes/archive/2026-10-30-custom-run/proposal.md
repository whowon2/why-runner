## Why

In the 2026-10-29 classroom survey two students asked to run their program before submitting (`docs/evaluation/survey-review.md`, item F6): "Eu gostaria de testar minhas entradas manualmente… a única maneira de executar é fazendo a submissão". Today every execution is a graded submission, so students spend submissions (and rate-limit budget) on experiments, and those experiments land in scores, the gradebook and contest standings.

## What Changes

- New "Run" action in every code editor (problem workspace Submit tab, contest problem upload, lesson exercise in `code` and `blocks` mode): a stdin textarea plus a Run button. It runs the current code once with that input in the judge's sandbox and shows stdout, stderr, exit status, time and memory.
- A run is never graded: no expected output, no comparison, no test cases loaded, and no effect on submissions, scores, gradebook, exercise completion, AI help, similarity or contest standings.
- New `code_run` table (own status enum `code_run_status`) and new `pg_notify` channel `new_run`. The `submission` table, its queries and the judge's grading path stay unchanged.
- Judge claims pending runs after pending submissions, executes them with the same `runner::prepare`/`execute` and isolate limits as grading (problem time limit scaled per language, language memory caps), caps stored stdout/stderr, dead-letters stuck runs and deletes runs older than 24 h.
- Abuse limits: 10 runs per user per minute, one run in flight per user, 64 KiB stdin, the existing 64 KiB code limit, 64 KiB stored stdout and stderr each.
- Contests: new `contest.allow_runs` setting (default on) in the Settings form; when off the Run button is hidden and the action refuses. Runs never read a problem's tests or checker, so they cannot reveal hidden tests.
- Rollout gate: `CUSTOM_RUN_ENABLED` server env var. The Run UI and action stay off until the judge that understands `code_run` is deployed on Fly.
- Versions: judge `1.0.1 → 1.1.0`, web `1.1.0 → 1.2.0` (main already took 1.1.0 for the survey fixes). `scripts/check-enum-sync.ts` also requires `code_run_status`.

## Capabilities

### New Capabilities
- `custom-run`: ungraded "run with custom input" in every code editor: UI, server action and access rules, limits, judge execution, result shape, retention and rollout gate.

### Modified Capabilities
- `contest-settings`: the configuration form gains an "Allow custom runs" toggle.

## Impact

- **DB**: migration `0052_code_run.sql`: `code_run_status` enum, `code_run` table, `contest.allow_runs` column. No change to `submission`. Coordinated with `fix/survey-feedback`, which adds no migration.
- **Judge** (`judge/src/`): `models.rs` (`CodeRun`, `CodeRunStatus`), `db.rs` (claim/update/reap/prune runs, `has_claimable_jobs`), `main.rs` (listen on `new_run`, `run_next_job`, `process_run_job`, sweep). `grade()`/`process_job()` untouched. `Cargo.toml` 1.1.0.
- **Web**: `drizzle/schemas/` (new `code-runs.ts`, `contests.ts`), `lib/judge.ts` (`new_run` channel), new actions `lib/actions/runs/{create-run,get-run}.ts`, hooks `use-create-run`/`use-run`, shared `components/code-run/` panel wired into the three editors, contest settings form + `update-contest`, `env.ts`, `messages/{pt,en}.json`, `package.json` 1.2.0.
- **CI**: `scripts/check-enum-sync.ts` REQUIRED list.
- **Deploy order**: merge → CI pushes judge image → `fly deploy -a why-runner-judge` → set `CUSTOM_RUN_ENABLED=true` on Vercel. An old judge would leave runs `PENDING` forever, so web must not expose Run first.
- **Docs**: `web/CLAUDE.md`, `judge/CLAUDE.md`, `docs/evaluation/post-evaluation-changes.md`, thesis/slides follow-ups.
