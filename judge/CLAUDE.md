# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Judge: Rust worker for the Runner platform. Polls Postgres for pending code submissions (via `LISTEN/NOTIFY` + periodic sweep), runs submitted code in sandboxed `isolate` boxes per language, compares stdout to expected output, writes results back to Postgres.

## Commands

- Run locally: `cargo run` (needs `.env` in this dir — see below, and `isolate` with elevated capabilities available on the host, see "Sandboxed execution (isolate)" below)
- Format: `cargo fmt`
- Build release: `cargo build --release`
- Local stack (Postgres + judge-worker): `docker compose up` (compose.yml at repo root)

24 tests exist in this crate: 4 `isolate::tests` unit tests (pure meta-parser tests) and 12 `constraints::tests` (pure static-analysis tests over source strings) both run fine on a bare host — neither touches `isolate` or spawns a process. The 8 `grade_tests` in `main.rs` (3 pre-existing, 5 added by the isolate-migration branch) shell out to the real sandbox end-to-end and need real `isolate` + elevated capabilities to run — they'll hang/fail confusingly on a bare host without them. Run the full suite via:

```sh
docker build --target builder -t judge:test -f judge/Dockerfile judge
docker run --rm --cap-add=SYS_ADMIN --cap-add=NET_ADMIN judge:test cargo test
```

`cargo test isolate::tests constraints::tests` is the subset that runs directly on a bare host without isolate/Docker; `cargo test grade_tests` needs the sandboxed invocation above.

### Required `.env`

```
DATABASE_URL=postgres://user:password@localhost/runner
```

## Architecture

Three files, straight-line flow, no framework:

- `src/main.rs` — main loop: reaps exhausted stuck-`RUNNING` submissions via `db.reap_exhausted_submissions()`, `PgListener` subscribes to `new_submission` channel; drains all claimable submissions via `db.get_next_submission()`, then blocks on `listener.recv()` with a 60s timeout fallback (periodic sweep in case a notify was missed). `process_job()` runs each submission through every test case sequentially, stopping at the first TLE / compile error / runtime error / wrong answer, and always writes a `JudgeReport` (JSON) back to the DB.
- `src/db.rs` — all SQL. `get_next_submission` does the claim atomically (`UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED)`), safe for multiple judge-worker replicas; it claims `PENDING` rows and also reclaims `RUNNING` rows abandoned by a crashed/killed worker (`updated_at` older than `STALE_RUNNING_THRESHOLD`), bumping `retry_count` each time. `reap_exhausted_submissions` dead-letters (`status = 'ERROR'`) `RUNNING` rows that hit `MAX_RETRIES` — this is the DLQ; it's DB-only (no SQS), the `submission.retry_count` column added specifically for it. `update_submission_result` also appends to the contest leaderboard (`user_on_contest.answered`) inside the same transaction when a submission PASSES — this DB write is the only leaderboard-affecting side effect in the codebase.
- `src/runner.rs` — per-language sandboxed execution via `isolate` (see "Sandboxed execution (isolate)" below). Each language builds a `sh -c` shell command (base64-encode source → write to file → compile/run) with language-specific memory limits and directory requirements, and hands it to `run_in_isolate` to sandbox.
- `src/models.rs` — `sqlx` row types (`Submission`, `Problem`) and serializable report types (`JudgeReport`, `TestCaseResult`). `Language` and `SubmissionStatus` are Postgres enums (`sqlx::Type`) — must match the DB schema's enum labels exactly (`language`/`submission_status` types, lowercase vs UPPERCASE rename rules differ per enum, see the `#[sqlx(...)]` attributes).

### Adding a new language

Add a variant to `Language` in `models.rs` matching the DB enum, add a `run_<lang>` fn in `runner.rs` following the existing pattern (base64 the source, write+compile+run in one shell command, delegate to `run_in_isolate` with appropriate `mem_kb` and `extra_dirs` if needed), and wire it into the `match` in `runner::run`. All six DB enum variants (`C`, `Cpp`, `Java`, `Python`, `Portugol`, `Rust`) have runners. `Java` submissions must define `public class Main` (the shell command writes source to `Main.java`).

### Sandboxed execution (isolate)

`src/runner.rs` sandboxes submissions via `isolate` (github.com/ioi/isolate),
not Docker — there is no host Docker daemon dependency at runtime. Each
`run_<lang>` function builds the same `sh -c` shell command string as
before (base64-decode source → write → compile → run, `COMPILE_ERROR_MARKER`
for compile-error detection), and `run_in_isolate` (`src/isolate.rs`) runs
it as `/bin/sh -c <command>` inside an `isolate` box: `isolate --box-id=N
--init`, then `--run` with `--time`/`--wall-time`/`--mem`/`--processes`
limits and `--stdin=<file>`, then `--cleanup`. No `--share-net` flag is
passed, so boxes have no network access by default. Resource usage
(exit code, wall time, peak RSS, TO/SG/RE status) comes from isolate's own
`--meta` file (`src/isolate.rs::parse_meta`), not a polling approximation.

Memory limits are language-specific:
- Python, C, C++: 128MB (DEFAULT_MEM_KB)
- Rust: 768MB (RUST_MEM_KB) — rustc's linked LLVM libraries cause high
  virtual-address-space usage despite modest real RSS
- Java, Portugol: 2GB (JVM_MEM_KB) — the JVM reserves large virtual address
  space by default even for trivial programs; real usage is bounded via
  `-Xmx`/`-XX:` flags passed through `JAVA_TOOL_OPTIONS`

All language toolchains (python3, gcc/g++, rustc, JDK 21, the Portugol
console jar) are installed directly in the judge image (see `Dockerfile`)
rather than pulled as separate per-language Docker images at runtime.
isolate's built-in default directory visibility includes `/bin`, `/lib`,
`/lib64`, and `/usr` (read-only), so these toolchains are reachable from
inside a sandboxed run. Additional directories (e.g. `/portugol` for the
Portugol jar, `/etc/alternatives` for Java/Rust symlinked toolchain binaries
on Debian) are bind-mounted per run via `--dir=` flags passed from `runner.rs`.

isolate requires elevated container capabilities to manage its own cgroups/
namespaces (see `compose.yml`'s `cap_add: [SYS_ADMIN, NET_ADMIN]`) — this is
a real container capability requirement, separate from (and much narrower than)
the old Docker-socket-mount approach, which needed full host Docker daemon
access. The judge Dockerfile's builder stage is pinned to `rust:1.91.1-bookworm`
(not a floating `rust:1.91.1` tag) to match the runtime stage's Debian version
and avoid glibc version mismatches.

### Portugol specifics

Portugol input is space/newline-normalized (`split_whitespace().join("\n")`)
before being piped in — Portugol's console runner expects one input token per
line, unlike the other languages which get raw stdin. The Portugol console jar
(`portugol/portugol-console-2.7.5.jar`) and its ANTLR/audio library dependencies
(`portugol/lib/`) are bundled directly in the judge image at `/portugol/` (not
built as a separate Docker image) and bind-mounted into sandboxed runs via
`--dir=/portugol`.

### `Portugol-Studio/`

Vendored upstream Java/Gradle project (the Portugol Studio IDE + interpreter source). Not part of the Rust build; referenced only insofar as `portugol/portugol-console-2.7.5.jar` (built from it) is what runs inside the sandboxed `isolate` box for Portugol submissions (see "Portugol specifics" above). Treat as a third-party checkout, not application code to edit as part of judge work.
