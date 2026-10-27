## Context

`grade()` in `judge/src/main.rs` already distinguishes compile error / TLE / runtime error / wrong answer internally (it logs them and writes different `failure_details.error` text), but `resolve_constraint_status` collapses every failure into `FAILED`. The only other final label, `ERROR`, is written by `db.rs::reap_exhausted_submissions` (dead letter) — the contest standings already rely on that meaning ("judge fault, don't penalise").

Output is compared with `actual.trim() != expected.trim()`. `problem.memory_limit_mb` exists in the schema but the judge ignores it: boxes use fixed per-language address-space caps (`--mem`, RLIMIT_AS, no cgroups), so exceeding memory shows up as an allocation failure → non-zero exit or signal, never as a clean "MLE" status from isolate.

Parallel work: `feat/judge-concurrency` owns the judge run loop, `process_job`'s orchestration and the claim queries in `db.rs`. This change must stay inside `grade()`, `resolve_constraint_status`, `models.rs`, `runner.rs`, new modules, and `db.rs::get_problem`'s column list.

## Goals / Non-Goals

**Goals:**
- Distinct, persisted verdicts for every failure kind the judge can tell apart.
- Existing rows (`FAILED`, `ERROR`) stay valid and keep rendering.
- Per-problem comparison mode, with lenient token comparison as the default for new problems while existing problems keep today's exact behaviour.
- Optional custom checker program, configured by the problem's author.

**Non-Goals:**
- Enforcing `problem.memory_limit_mb` (the box caps stay per-language). MLE is detected, not newly enforced.
- Per-test verdict lists in the report (report still holds the first failure only).
- Changing validation-run statuses (`problem_validation.status` stays `PASSED`/`FAILED`).
- Problem import format changes (imported problems get the DB default).
- Partial scoring / interactive problems.

## Decisions

### D1. Add verdicts alongside `FAILED`/`ERROR`, don't replace
`ALTER TYPE submission_status ADD VALUE` ×5. Postgres can't drop enum values cheaply, and rewriting historical `FAILED` rows into a guessed verdict would invent data (the old reports don't reliably say which kind it was). So:
- `FAILED` → legacy only; new submissions never get it. Displayed as "Failed".
- `ERROR` → keeps meaning "judge fault": dead-lettered rows, sandbox init failure, checker crash/misconfiguration. Never penalised.
- New: `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `COMPILATION_ERROR`, `RUNTIME_ERROR`.

Alternative: a separate `verdict` column next to `status`. Rejected: every status-switching callsite would need to look at two columns, and the task explicitly wants the status itself richer.

### D2. Verdict = first failing test case's verdict
`grade()` returns a `JudgeReport` with a new `verdict: SubmissionStatus` field (serialized as the enum label, e.g. `"WRONG_ANSWER"`; `"PASSED"` when everything passed). `resolve_constraint_status` returns `report.verdict` instead of `FAILED` when `!report.passed`. With `run_all` (lesson exercises) it is still the first failure, matching `failure_details`. Old reports have no `verdict`; the web type marks it optional.

Validation runs keep `PASSED`/`FAILED` as row status (the validation UI and publish gate key on them) but the report carries `verdict`, so the panel can show *why*.

Classification order per test: sandbox internal failure → `ERROR`; timeout → `TLE`; failed run that looks like OOM → `MLE`; other non-zero exit/signal → `RUNTIME_ERROR`; output mismatch → `WRONG_ANSWER`. Compile failure (before any test) → `COMPILATION_ERROR`; prepare failing for a non-compile reason → `ERROR`.

### D3. MLE detection is a heuristic in `runner.rs`
`ExecutionResult` gains `is_memory_limit: bool`, set when the run failed (non-zero exit or signal) and either peak RSS ≥ 90 % of the box `mem_kb`, isolate's meta message mentions memory, or stderr contains a known allocation-failure marker (`MemoryError`, `std::bad_alloc`, `java.lang.OutOfMemoryError`, `memory allocation of`, `Cannot allocate memory`, `out of memory`). The decision is a pure function (`looks_like_memory_limit`) so it is unit-testable on a bare host. Alternative: `--cg` cgroup memory accounting for an exact OOM signal — rejected, the deploy notes (Fly tmpfs box root) and JVM address-space behaviour make cgroups mode a separate project.

### D4. Comparison lives in a pure module `judge/src/compare.rs`
`fn compare(mode, epsilon, actual, expected) -> bool` for the built-in modes:
- `exact`: `actual.trim() == expected.trim()` — byte-identical to today, so migrated problems behave exactly as before.
- `tokens`: `split_whitespace()` sequences equal (ignores spacing, blank lines, trailing newline, CRLF).
- `float`: token sequences of equal length; a pair matches if both parse as finite `f64` and `|a−b| ≤ ε` or `|a−b| ≤ ε·|b|` (absolute-or-relative), otherwise the strings must be equal. `nan`/`inf` tokens compare as strings.

Pure functions → full unit tests without isolate.

### D5. Custom checker = author program run in isolate, testlib-style exit codes
Stored in a separate table `problem_checker(problem_id PK FK → problem ON DELETE CASCADE, language, code, updated_at)` rather than columns on `problem`. Reason: many student-facing queries load whole `problem` rows (`db.query.problem.findFirst` without `columns`); a separate table makes leaking the checker source impossible by construction. `problem.compare_mode = 'checker'` selects it.

Protocol: the checker is prepared (compiled) once per graded submission with the existing `runner::prepare`. For each test whose run succeeded, a fresh box gets `input.txt`, `output.txt` (contestant stdout), `answer.txt` (declared output) and runs `<run_command> input.txt output.txt answer.txt` with a fixed 10 s CPU budget. Exit 0 → accepted; exit 1 → `WRONG_ANSWER` (checker stdout, truncated to 1 KB, becomes the failure message); anything else, TLE, or checker compile failure → `ERROR` with a "checker failed" message (judge-side fault, not penalised, visible to the author via validation). Portugol is not offered as a checker language (its runner rewrites stdin and can't take argv).

New runner entry point: `execute_checker(checker, input, output, answer)` reusing `in_box`; `execute` is unchanged for normal runs.

Alternative considered: checker reads a single concatenated stdin — rejected, ambiguous delimiters and not the convention professors know from testlib/BOCA.

### D6. Defaults and migration (single migration `0048`)
```sql
ALTER TYPE submission_status ADD VALUE 'WRONG_ANSWER'; -- ×5
CREATE TYPE problem_compare_mode AS ENUM ('exact','tokens','float','checker');
ALTER TABLE problem ADD COLUMN compare_mode problem_compare_mode DEFAULT 'tokens' NOT NULL;
ALTER TABLE problem ADD COLUMN float_epsilon double precision DEFAULT 0.000001 NOT NULL;
UPDATE problem SET compare_mode = 'exact';           -- existing problems keep current behaviour
CREATE TABLE problem_checker (...);
```
`ADD VALUE` inside drizzle's migration transaction is fine on PG ≥ 12 because the new labels aren't used in the same transaction. Generated with `bun db:generate`, then the `UPDATE` hand-added and the file named `0048_*`.

### D7. Web: one status badge, one status-class helper
`lib/submission-status.ts` (pure): `REJECTED_STATUSES`, `FINAL_STATUSES`, `isRejected(status)`, `statusTone(status)` → Tailwind text/border classes. `components/submissions/status-badge.tsx` renders the localized label (`SubmissionStatus.<LABEL>` in `messages/{en,br}.json`). The four tables/lists that print raw `submission.status` and their duplicated `cn({...})` maps switch to it. `classifyStatus` in `lib/contest/standings.ts` keeps its exhaustive `switch` (TS catches missing cases).

### D8. Professor UI and server action
`create.tsx` (the problem edit form) gets an "Output comparison" section: mode select with a one-line explanation per mode, epsilon input (only for `float`), checker language select + code textarea (only for `checker`). `updateProblem`'s zod schema gains `compareMode`, `floatEpsilon` (0 < ε ≤ 1) and `checker: {language, code} | null`; the problem update and checker upsert/delete run in one transaction, and `compareMode = 'checker'` without a checker (new or existing) is rejected. `get-problem-for-edit` (owner-only) returns the checker.

### D9. Validation staleness includes comparison settings — without invalidating old hashes
`computeIoHash(inputs, outputs, compare?)` adds `{mode, epsilon, checker}` to the hashed payload **only when the mode isn't `exact`**. Existing problems are `exact` after migration, so their stored `io_hash` stays valid; any change of mode/ε/checker re-requires validation.

## Risks / Trade-offs

- [MLE heuristic misfires (a program that crashes near the cap, or prints "out of memory" to stderr itself)] → only applied to runs that already failed, so the worst case is MLE shown instead of RE; never changes pass/fail.
- [Checker code is untrusted-ish author code] → runs in the same isolate sandbox, no network, fixed limits; only the problem's author can set it.
- [Concurrency branch also edits `main.rs`] → only `grade()` and `resolve_constraint_status` bodies change, plus `mod compare;`; checker orchestration goes into new code paths, not the loop.
- [Clients on an old deploy see unknown enum labels] → the badge falls back to the raw label for unknown values.
- [`ALTER TYPE ... ADD VALUE` is irreversible] → rollback = redeploy old judge/web; the new labels simply go unused. Old judge writing `FAILED` remains valid.

## Migration Plan

1. Apply migration `0048` (web deploy runs `db:migrate`).
2. Deploy the judge (writes new verdicts; reads new columns — must run after the migration).
3. Deploy web (renders new verdicts). Order 2/3 interchangeable since web handles unknown labels.

## Open Questions

- None blocking. Whether to show the comparison mode to students on the problem page (e.g. "answers within 1e-6 accepted") is left as a follow-up.
