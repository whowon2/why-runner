# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Judge: Rust worker for the Runner platform. Polls Postgres for pending code submissions (via `LISTEN/NOTIFY` + periodic sweep), runs submitted code in sandboxed Docker containers per language, compares stdout to expected output, writes results back to Postgres.

## Commands

- Run locally: `cargo run` (needs `.env` in this dir — see below, and Docker running on host)
- Format: `cargo fmt`
- Build release: `cargo build --release`
- Local stack (Postgres + judge-worker + portugol image): `docker compose up` (compose.yml at repo root)

No test suite exists in this crate currently.

### Required `.env`

```
DATABASE_URL=postgres://user:password@localhost/runner
```

## Architecture

Three files, straight-line flow, no framework:

- `src/main.rs` — main loop: reaps exhausted stuck-`RUNNING` submissions via `db.reap_exhausted_submissions()`, `PgListener` subscribes to `new_submission` channel; drains all claimable submissions via `db.get_next_submission()`, then blocks on `listener.recv()` with a 60s timeout fallback (periodic sweep in case a notify was missed). `process_job()` runs each submission through every test case sequentially, stopping at the first TLE / compile error / runtime error / wrong answer, and always writes a `JudgeReport` (JSON) back to the DB.
- `src/db.rs` — all SQL. `get_next_submission` does the claim atomically (`UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED)`), safe for multiple judge-worker replicas; it claims `PENDING` rows and also reclaims `RUNNING` rows abandoned by a crashed/killed worker (`updated_at` older than `STALE_RUNNING_THRESHOLD`), bumping `retry_count` each time. `reap_exhausted_submissions` dead-letters (`status = 'ERROR'`) `RUNNING` rows that hit `MAX_RETRIES` — this is the DLQ; it's DB-only (no SQS), the `submission.retry_count` column added specifically for it. `update_submission_result` also appends to the contest leaderboard (`user_on_contest.answered`) inside the same transaction when a submission PASSES — this DB write is the only leaderboard-affecting side effect in the codebase.
- `src/runner.rs` — per-language sandboxed execution. Each language builds a `sh -c` shell command (base64-encode source → write to file → compile/run) and hands it to `run_in_docker`, which spawns `docker run --rm -i --network none --memory 128m --cpus 0.5 <image> sh -c <command>`, pipes stdin, and enforces the wall-clock time limit via `tokio::time::timeout` (kills container on expiry, `kill_on_drop(true)`).
- `src/models.rs` — `sqlx` row types (`Submission`, `Problem`) and serializable report types (`JudgeReport`, `TestCaseResult`). `Language` and `SubmissionStatus` are Postgres enums (`sqlx::Type`) — must match the DB schema's enum labels exactly (`language`/`submission_status` types, lowercase vs UPPERCASE rename rules differ per enum, see the `#[sqlx(...)]` attributes).

### Adding a new language

Add a variant to `Language` in `models.rs` matching the DB enum, add a `run_<lang>` fn in `runner.rs` following the existing pattern (base64 the source, write+compile+run in one shell command, delegate to `run_in_docker` with the right image), and wire it into the `match` in `runner::run`. All six DB enum variants (`C`, `Cpp`, `Java`, `Python`, `Portugol`, `Rust`) have runners. `Java` submissions must define `public class Main` (the shell command writes source to `Main.java`).

### Docker-in-Docker

The judge-worker container itself mounts `/var/run/docker.sock` (see `compose.yml` and `Dockerfile`) so it can spawn sibling sandbox containers on the host's Docker daemon — it does not run Docker-in-Docker nested, it's a sibling-container pattern. Sandbox containers get no network and capped memory/CPU; there is no source-level input sanitization since untrusted code executes in a language runtime, not the shell (the shell command itself is judge-constructed, not attacker-constructed, aside from the base64 payload).

### Portugol specifics

Portugol input is space/newline-normalized (`split_whitespace().join("\n")`) before being piped in — Portugol's console runner expects one input token per line, unlike the other languages which get raw stdin. The `portugol:latest` image is built from `./portugol/Dockerfile` (bundles the Portugol Studio console jar + ANTLR/audio libs under `portugol/lib/`).

### `Portugol-Studio/`

Vendored upstream Java/Gradle project (the Portugol Studio IDE + interpreter source). Not part of the Rust build; referenced only insofar as `portugol/portugol-console-2.7.5.jar` (built from it) is what `portugol:latest`'s Docker image runs. Treat as a third-party checkout, not application code to edit as part of judge work.
