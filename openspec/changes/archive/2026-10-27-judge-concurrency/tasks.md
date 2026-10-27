## 1. Baseline

- [x] 1.1 Add the `#[ignore]` `throughput_bench` test to `grade_tests` (fixed mixed C/C++/Python/Java batch, `BENCH_CONCURRENCY` slots, prints jobs/s), and run it with 1 slot in the judge image to record the sequential baseline

## 2. Box isolation

- [x] 2.1 In `isolate.rs`, add the `WORKER_SLOT` task-local and `MAX_WORKERS = 64`; make `alloc_box_id` return the slot when set, else rotate within `[MAX_WORKERS, 1000)`
- [x] 2.2 Unit tests: slot-scoped allocation returns the slot; fallback ids never fall in the worker range

## 3. Worker pool

- [x] 3.1 Add `parse_concurrency(Option<&str>, cpus) -> usize` (default min(cpus, 4), clamp 1..=MAX_WORKERS), plus unit tests
- [x] 3.2 `DbClient::new` takes a max-connections argument; size it to `max(10, N + 2)`
- [x] 3.3 Replace the main loop with a dispatcher (reaper, LISTEN, 60 s sweep, `notify_waiters`) and N worker tasks (`Notified::enable` before drain, woken by the dispatcher, jobs run inside `WORKER_SLOT.scope`)
- [x] 3.4 Idle auto-stop through `PoolState` (`active`, `last_activity`, `stopping`) plus a `db.has_claimable_jobs()` check, with a graceful drain that joins workers before exiting
- [x] 3.5 Prefix worker log lines with `[wN]`

## 4. Verify

- [x] 4.1 `cargo build`, `cargo fmt`, and the bare-host unit tests pass
- [x] 4.2 Run the full `grade_tests` in the judge image, including a concurrent-grading correctness test
- [x] 4.3 Run `throughput_bench` with N = 1 and N = 4 and record the numbers in design.md § Results
- [x] 4.4 End-to-end smoke against a throwaway Postgres: burst of PENDING submissions, each graded exactly once; idle exit drains cleanly

## 5. Docs

- [x] 5.1 Update `judge/CLAUDE.md` architecture (worker pool, `JUDGE_CONCURRENCY`, box slots, test count)
