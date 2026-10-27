## Why

The judge handles one submission at a time: `judge/src/main.rs` claims one job, runs every test case, writes the result, then claims the next. In a contest rush, submissions queue behind each other even when the host has idle CPU cores. Concurrent processing cuts queue latency, and the before/after throughput number goes into the thesis.

## What Changes

- The judge runs a pool of N worker tasks inside one process. N comes from a new `JUDGE_CONCURRENCY` env var. When unset, N defaults to the number of available CPUs, capped at 4, because the 2 GB Fly.io VM has limited memory for concurrent sandboxes.
- Each worker claims jobs through the existing atomic `FOR UPDATE SKIP LOCKED` claim queries in `judge/src/db.rs`, so two workers never get the same submission or validation row. The SQL does not change. The connection pool is sized for N workers plus the reaper and the listener.
- Each worker gets a fixed isolate box id. Two jobs running at the same time can't share a box directory, and a box that a crashed process left behind is still cleaned before `--init`.
- A dispatcher task keeps the existing wake-up rules: it reaps exhausted submissions, `LISTEN`s on `new_submission`/`new_validation`, and wakes idle workers on a notification or on the 60 s periodic sweep.
- Idle auto-stop (`JUDGE_IDLE_EXIT_SECS`) now fires only when every worker is idle. Shutdown is graceful: workers stop claiming, finish the job they're on, then the process exits, so no row is left stuck in `RUNNING`.
- New unit tests cover concurrency parsing and box-id allocation. A sandboxed test grades several submissions concurrently and checks the verdicts are correct. An ignored benchmark test measures jobs/s for N = 1 and N > 1.

No migrations, no web changes, no change to grading/compare logic or to the `SubmissionStatus`/`Language` enums.

## Capabilities

### New Capabilities
- `judge-concurrency`: the judge processes multiple submissions at once with a bounded, configurable worker count. Claiming is exclusive, sandboxes are isolated per worker, and the existing wake-up (notify + sweep) and idle-shutdown behavior is kept.

### Modified Capabilities
<!-- none: judge-time-limits requirements are unchanged -->

## Impact

- Code: `judge/src/main.rs` (main loop → dispatcher + worker pool; `process_job`/`grade` are not touched), `judge/src/isolate.rs` (box-id allocation), `judge/src/db.rs` (pool sizing only).
- Config: new optional `JUDGE_CONCURRENCY` env var. `judge/fly.toml` is left as is: on a `shared-cpu-1x` VM the default resolves to 1, so production behavior doesn't change until the VM gets more CPUs.
- Docs: `judge/CLAUDE.md` architecture section.
- Dependencies: none new (tokio already has `sync` and task-local support).
