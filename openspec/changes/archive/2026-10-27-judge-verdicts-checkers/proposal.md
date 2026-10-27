## Why

The judge only reports `PASSED` / `FAILED` / `ERROR`, so a student can't tell a wrong answer from a timeout, a crash, a compile error or a memory blow-up without opening the report, and the leaderboard can't treat them differently (e.g. not penalising compile errors). Grading also compares `stdout.trim() == expected.trim()`, which rejects correct answers that differ only in inner whitespace or floating-point rounding, so professors have to hand-tune expected outputs and can't write problems with several valid answers.

## What Changes

- Add five final verdicts to the `submission_status` enum (Rust + Drizzle together): `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `COMPILATION_ERROR`, `RUNTIME_ERROR`. They are added **alongside** the existing labels: `FAILED` stays valid for historical rows (no longer written for new submissions), `ERROR` keeps meaning "judge-side fault" (dead-lettered rows, sandbox/checker failures).
- The judge writes the verdict of the first failing test case as the submission status, and records it in the JSON report (`JudgeReport.verdict`).
- Problem validation runs keep writing `PASSED` / `FAILED` (unchanged), but their report also carries the verdict.
- Web: one shared status badge (colour + localized label, pt/en) replaces the raw enum text in the problem workspace, contest submission list, contest management and exercise detail; "is this a rejection?" checks (AI-help button, notifications, exercise detail) cover the new verdicts.
- Contest standings: `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `RUNTIME_ERROR` count as rejected attempts (like `FAILED`); `COMPILATION_ERROR` is ignored, like `ERROR` (ICPC convention).
- Per-problem output comparison: new `problem.compare_mode` (`exact` | `tokens` | `float` | `checker`), `problem.float_epsilon`, and an optional custom checker program (`checker_code`, `checker_language`). Existing problems are migrated to `exact` (today's behaviour); new problems default to `tokens`.
- Problem edit form gets a "Output comparison" section for the professor (mode, epsilon, checker code/language). Changing comparison settings makes the reference-solution validation stale.
- One migration: `0048`.

## Capabilities

### New Capabilities
- `judge-verdicts`: the set of final submission verdicts, how the judge picks one, how they are displayed and labelled.
- `output-comparison`: per-problem compare modes (exact, tokens, float with epsilon, custom checker), their semantics, defaults and professor configuration.

### Modified Capabilities
- `contest-leaderboard`: rejected-attempt counting now covers the new verdicts; `COMPILATION_ERROR` is not penalised.
- `problem-io-validation`: staleness also tracks the problem's comparison settings; the validation report shows the failing verdict.

## Impact

- `judge/src/models.rs` (enum, `Problem`, `JudgeReport`), the `grade` function and `resolve_constraint_status` in `judge/src/main.rs`, a new `judge/src/checker.rs` (comparison logic), `judge/src/runner.rs` (run a checker with extra files, memory-limit detection), `judge/src/db.rs::get_problem` column list only. The judge main loop, job claiming and db claim queries are untouched (owned by `feat/judge-concurrency`).
- `web/drizzle/schemas/{submissions,problems}.ts`, migration `web/drizzle/migrations/0048_*.sql`.
- Web UI: status badge component + `messages/{en,br}.json`, `lib/contest/standings.ts` (+ tests), problem edit form, `update-problem` / `get-problem-for-edit` actions, validation staleness hash.
- Security: `checker_code` is professor-only data; student-facing problem queries must not return it.
