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

## Where to look

- Frontend/API work → read `web/CLAUDE.md` first, then work inside `web/`.
- Sandboxed execution / grading logic → read `judge/CLAUDE.md` first, then work inside `judge/`.
- `openspec/` — spec-driven change workflow config (currently no active changes or specs checked in).
- `overleaf/` — LaTeX source for the accompanying thesis paper (SBC template).
- `AUDITORIA_PRE_DEFESA.md` — Portuguese-language pre-defense audit/punch-list notes for the thesis, not application docs.
- `problems.json`, `Why-runner.pdf`, `cbie.txt` — supporting TCC artifacts (sample problem set, thesis PDF, conference info), not consumed by either app at runtime.
