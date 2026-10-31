# ⚖️ Judge: Remote Code Execution Service

This is the worker service for the Runner platform. It polls PostgreSQL for submitted code evaluations, runs the code in an `isolate` (github.com/ioi/isolate) sandbox, and writes the results back to the database.

## 🏗️ Stack

- **Language:** Rust (Edition 2024)
- **Async Runtime:** [Tokio](https://tokio.rs/)
- **Database driver:** [sqlx](https://github.com/launchbadge/sqlx) (PostgreSQL asynchronous driver)
- **Sandboxing:** [`isolate`](https://github.com/ioi/isolate) via `tokio::process::Command` (per-language time/memory limits, no network access; see `deploy/README.md`'s "Capabilities and platform requirements" section for the `CAP_SYS_ADMIN` + `CAP_NET_ADMIN` requirements)

## ⚙️ How it Works

1. The Judge listens for Postgres `LISTEN/NOTIFY` on the `new_submission` channel and does a periodic sweep every 60s as a fallback, then claims `PENDING` submissions with `UPDATE ... FOR UPDATE SKIP LOCKED` (safe across multiple judge-worker replicas).
2. Submissions abandoned mid-job by a crashed or killed worker (stuck `RUNNING`) are reclaimed and retried up to a fixed retry limit, then dead-lettered to `ERROR` if still stuck.
3. It fetches the submitted code and problem test cases from Postgres, then spawns a sandboxed, network-less `isolate` box per test case to run the code, feeding each test's input on stdin.
4. The code is executed against each test case's input, and `stdout` is compared with the expected output.
5. The first failing test case sets the verdict: `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `COMPILATION_ERROR`, `RUNTIME_ERROR`, or `ERROR` for a judge-side fault (`PASSED` if all pass).
6. The verdict and a JSON report with per-test details are saved back to the submission row.

## 🚀 Getting Started

### Prerequisites

- [Rust & Cargo](https://rustup.rs/) (Stable toolchain)
- `isolate` (github.com/ioi/isolate) installed, plus the elevated capabilities it needs (`CAP_SYS_ADMIN`, `CAP_NET_ADMIN`) — see `deploy/README.md`'s "Capabilities and platform requirements" section. The provided `Dockerfile`/`compose.yml` set this up; running `cargo run` directly on bare metal requires the same capabilities on the host.
- PostgreSQL Database (running locally or via the root `compose.yml`)

### Environment Variables

Create a `.env` file inside the `judge` directory. Note that the `.env` footprint is ignored by git for security:

```env
DATABASE_URL=postgres://user:password@localhost/runner
```

### Running Locally

```bash
cargo run
```

### Formatting

To format the rust codebase, use cargo:

```bash
cargo fmt
```
