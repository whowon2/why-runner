# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

WhyRunner — a competitive/judged code-execution platform (TCC / thesis project, IFMG). Two independent services, now folded into this single git repository (previously separate nested repos):

- `web/` — Next.js 16 frontend + server actions + Postgres (Drizzle). See `web/CLAUDE.md`.
- `judge/` — Rust worker that executes submitted code in sandboxed Docker containers and grades it. See `judge/CLAUDE.md`.

This root directory is the git repo root for both `web/` and `judge/`, plus non-code TCC material (below). There's still no root-level build/test/lint command that spans both — run each subdirectory's own tooling from inside it.

## How the two services connect

`web` writes a `PENDING` submission row to Postgres and calls `pg_notify('new_submission', ...)`; `judge` listens on that channel (with a periodic sweep fallback), claims the row, runs the code per test case in a network-less Docker sandbox, and writes results back to the same Postgres database. Both share the same DB but not a shared schema-definition source — `judge/src/models.rs`'s Rust enums (`Language`, `SubmissionStatus`) must be kept in sync by hand with `web/drizzle/schemas/`'s Drizzle enums.

(Note: `web/README.md` describes an AWS SQS queue between web and judge — that's stale; the actual mechanism is Postgres LISTEN/NOTIFY, per both CLAUDE.md files and `judge/src/main.rs`.)

## Parallel tasks → new worktree

Each branch holds one task, and each checkout holds one agent. Never start a new task in the main checkout (`why-runner/`), even when it is on `main`: other sessions may be running there and can switch its branch under you. The session-start git snapshot is not refreshed; the `UserPromptSubmit` hook (`scripts/claude-branch-guard.sh`) injects the live branch each prompt and warns when another Claude session shares this checkout. Trust it over the snapshot, and if it warns, move new work to a worktree.

When the user asks for new work, or work unrelated to the current branch's task (e.g. on `feat/evaluation-surveys`, asked to change the ctrl+k command palette), do not do it in this checkout:

1. Say it looks like a separate task and propose a branch name (`feat/...` / `fix/...`).
2. Run `scripts/new-worktree.sh <branch> main "<self-contained task prompt>"`. It creates `../why-runner-<name>`, copies `web/.env*` and `judge/.env*`, and runs `bun install`. Inside zellij it also opens a tab named `<name>` running `claude "<prompt>"`, so the new session starts on the task right away; write the prompt so it stands alone (the new session has none of this conversation).
3. Outside zellij, tell the user to run `cd ../why-runner-<name> && claude` and give them the prompt to paste. Either way, don't touch that worktree's files from this session.

Follow-ups, fixes and small tweaks to the current branch's own task stay here. If unsure whether something is related, ask. Parallel worktrees share one Postgres DB: if both branches need migrations, flag the numbering collision in `web/drizzle/migrations/`. Each worktree gets its own dev port (`DEV_PORT` in its `web/.env.local`, with `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` matching): run `bun dev -p $DEV_PORT` there, never plain `bun dev`. GitHub/Google OAuth callbacks are registered for `:3000` only, so social login may fail on other ports; use email login there. Cleanup: `scripts/prune-worktrees.sh` (`-n` = dry run) removes every sibling worktree whose branch is merged into `origin/main` (merge commit or merged PR) and has no uncommitted changes, deletes its local branch, and closes its zellij tab. Run it from the main checkout after merging a worktree's PR, or when the user asks to clean up.

## Where to look

- Frontend/API work → read `web/CLAUDE.md` first, then work inside `web/`.
- Sandboxed execution / grading logic → read `judge/CLAUDE.md` first, then work inside `judge/`.
- `openspec/` — spec-driven change workflow config (currently no active changes or specs checked in).
- `overleaf/` — LaTeX source for the accompanying thesis paper (SBC template).
- `bench/` — reproducible benchmarks behind every performance number in the thesis and deck v4 (`bench/README.md`: hardware, safety rules, re-run commands; raw data in `bench/results/`, charts via `bench/charts.py`).
- `docs/presentation/` — deck build scripts (`build_v3.py`, `build_v4.py`), screenshot seed/shooter (`seed_v4.py`, `shoot_v4.py`), screenshots and charts.
- `AUDITORIA_PRE_DEFESA.md` — Portuguese-language pre-defense audit/punch-list notes for the thesis, not application docs.
- `problems.json`, `Why-runner.pdf`, `cbie.txt` — supporting TCC artifacts (sample problem set, thesis PDF, conference info), not consumed by either app at runtime.
