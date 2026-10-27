# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Judge: Rust worker for the Runner platform. Polls Postgres for pending code submissions (via `LISTEN/NOTIFY` + periodic sweep), runs submitted code in sandboxed `isolate` boxes per language, compares stdout to expected output, writes results back to Postgres.

## Commands

- Run locally: `cargo run` (needs `.env` in this dir — see below, and `isolate` with elevated capabilities available on the host, see "Sandboxed execution (isolate)" below)
- Format: `cargo fmt`
- Build release: `cargo build --release`
- Local stack (Postgres + judge-worker): `docker compose up` (compose.yml at repo root)

36 tests (+1 ignored benchmark) exist in this crate: 6 `isolate::tests` unit tests (meta parser + box-id allocation), 12 `constraints::tests` (pure static-analysis tests over source strings) and 4 `pool_tests` (`JUDGE_CONCURRENCY` parsing) all run fine on a bare host — none touches `isolate` or spawns a process. The 14 `grade_tests` in `main.rs` shell out to the real sandbox end-to-end and need real `isolate` + elevated capabilities to run — they'll hang/fail confusingly on a bare host without them. Run the full suite via:

```sh
docker build -t judge:test -f judge/Dockerfile judge
docker run --rm --cap-add=SYS_ADMIN --cap-add=NET_ADMIN -e CARGO_TARGET_DIR=/tmp/target -v "$(pwd)/judge":/src -w /src judge:test \
  sh -c "apt-get update -qq && apt-get install -y -qq curl pkg-config libssl-dev && curl https://sh.rustup.rs -sSf | sh -s -- -y -q && . \$HOME/.cargo/env && cargo test"
```

(Build the full final-stage image, not `--target builder` — the builder stage alone has no `isolate` binary, since that's only copied into the final stage; `grade_tests` would fail with "isolate: command not found" against a builder-only image. Installing Rust inside a container of the final image is the working pattern — the shipped image itself doesn't need a Rust toolchain at runtime, only for this test invocation.)

`isolate::tests`, `constraints::tests` and `pool_tests` (one filter per `cargo test` call) run directly on a bare host without isolate/Docker; `cargo test grade_tests` needs the sandboxed invocation above.

Throughput benchmark (thesis numbers, results in `openspec/changes/archive/2026-10-27-judge-concurrency/design.md`): same sandboxed invocation, with `-e BENCH_CONCURRENCY=4 -e BENCH_JOBS=48` and `cargo test --release throughput_bench -- --ignored --nocapture`. It grades a mixed batch with 1 slot, then with N slots, and prints jobs/s.

### Required `.env`

```
DATABASE_URL=postgres://user:password@localhost/runner
```

## Architecture

Three files, straight-line flow, no framework:

- `src/main.rs` — dispatcher + worker pool. `main` spawns N worker tasks (`JUDGE_CONCURRENCY`; default = available CPUs capped at 4, clamped to 1..=64; `shared-cpu-1x` on Fly therefore runs 1). Each worker drains claimable submissions (`db.get_next_submission()`), then validations, then sleeps on a shared `Notify`. The dispatcher owns the `PgListener` (`new_submission`/`new_validation`). On every notification or 60s timeout (periodic sweep in case a notify was missed) it reaps exhausted stuck-`RUNNING` submissions (`db.reap_exhausted_submissions()`) and wakes idle workers. Idle auto-stop (`JUDGE_IDLE_EXIT_SECS`) fires only when no worker is active, nothing finished for that long, and `db.has_claimable_jobs()` is false. It then stops claiming and joins the workers, so in-flight jobs still save. Each job runs inside `isolate::WORKER_SLOT.scope(slot, …)`, which makes the worker's slot its isolate box id. `process_job()` runs each submission through every test case sequentially, stopping at the first TLE / compile error / runtime error / wrong answer, and always writes a `JudgeReport` (JSON) back to the DB. Keep `JUDGE_CONCURRENCY` ≤ vCPUs: oversubscribed CPUs stretch wall time towards isolate's `--wall-time` (spurious TLEs), and concurrent rustc/JVM runs share the VM's RAM and the 512MB box_root tmpfs.
- `src/db.rs` — all SQL. `get_next_submission` does the claim atomically (`UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED)`), safe for multiple judge-worker replicas; it claims `PENDING` rows and also reclaims `RUNNING` rows abandoned by a crashed/killed worker (`updated_at` older than `STALE_RUNNING_THRESHOLD`), bumping `retry_count` each time. `reap_exhausted_submissions` dead-letters (`status = 'ERROR'`) `RUNNING` rows that hit `MAX_RETRIES` — this is the DLQ; it's DB-only (no SQS), the `submission.retry_count` column added specifically for it. `update_submission_result` also appends to the contest leaderboard (`user_on_contest.answered`) inside the same transaction when a submission PASSES — this DB write is the only leaderboard-affecting side effect in the codebase.
- `src/runner.rs` — per-language sandboxed execution via `isolate` (see "Sandboxed execution (isolate)" below). Two steps: `prepare()` runs once per submission — compiled languages (C, C++, Rust, Java) compile in their own box with a fixed `COMPILE_TIME_SECS` budget and the build output (`program`, or every `*.class`) is read back into memory; Python/Portugol just stage the source. `execute()` then runs the prepared files in a fresh box per test case, with the CPU limit from `time_limit_secs(language, problem.time_limit_ms)` (problem limit × per-language factor + startup allowance; Portugol compiles its generated Java inside every run, so it gets the biggest allowance). Compile time never counts against the problem's limit.
- `src/models.rs` — `sqlx` row types (`Submission`, `Problem`) and serializable report types (`JudgeReport`, `TestCaseResult`). `Language` and `SubmissionStatus` are Postgres enums (`sqlx::Type`) — must match the DB schema's enum labels exactly (`language`/`submission_status` types, lowercase vs UPPERCASE rename rules differ per enum, see the `#[sqlx(...)]` attributes).

### Adding a new language

Add a variant to `Language` in `models.rs` matching the DB enum, add an arm to the `match` in `runner::prepare` (interpreted: stage the source file + run command; compiled: a `CompileSpec` with the compile command and its artifacts, plus the run command, `mem_kb` and `extra_dirs` if needed), and an arm in `runner::time_limit_secs`. All six DB enum variants (`C`, `Cpp`, `Java`, `Python`, `Portugol`, `Rust`) have runners. `Java` submissions must define `public class Main` (the shell command writes source to `Main.java`).

### Sandboxed execution (isolate)

`src/runner.rs` sandboxes submissions via `isolate` (github.com/ioi/isolate),
not Docker — there is no host Docker daemon dependency at runtime. Source and
compiled artifacts are written straight into the box directory from the host,
and `in_box` runs the language's command as `/bin/sh -c <command>` inside an
`isolate` box (`src/isolate.rs`; box id = the pool worker's slot, ids `0..64` reserved for workers, anything run outside a worker such as tests rotates through `64..1000`): `isolate --box-id=N --init`, then `--run`
with `--time`/`--wall-time` (fractional seconds)/`--mem`/`--processes` limits
and `--stdin=<file>`, then `--cleanup`. A compile step is just such a run
whose non-zero exit means a compile error. No `--share-net` flag is
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
