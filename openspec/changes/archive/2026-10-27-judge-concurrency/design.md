## Context

`judge/src/main.rs` is a single loop. It reaps exhausted submissions, drains every claimable submission and then every claimable validation one at a time, checks idle auto-stop, and blocks on `PgListener::recv()` with a 60 s timeout. Jobs are already claimed atomically (`UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING …` in `db.rs`), so the SQL is safe for concurrent callers. Box ids come from a process-global `AtomicU32` taken mod 1000. That is safe sequentially but has no ownership guarantee under concurrency.

Production runs on one Fly.io Machine (`shared-cpu-1x`, 2 GB RAM). Its `box_root` is a 512 MB tmpfs (`entrypoint.sh`), and web starts the machine on demand, which is why idle auto-stop exists. isolate limits each process with `RLIMIT_AS` (no `--cg`), so real per-box RSS isn't capped in aggregate. Concurrent rustc/JVM runs share the 2 GB.

Constraint from parallel work: `grade()` and `process_job`'s result mapping belong to `feat/judge-verdicts-checkers`. No migrations, no enum changes.

## Goals / Non-Goals

**Goals:**
- N jobs in flight in one process, with N configurable and a safe default.
- Exclusive claims and non-overlapping isolate boxes.
- Keep notify wake-up, the 60 s sweep, reaping, and idle auto-stop. Add a graceful drain on exit.
- A reproducible throughput measurement for the thesis.

**Non-Goals:**
- Horizontal scaling across machines (it already works via SKIP LOCKED, and nothing here changes it).
- Per-cgroup memory accounting (`isolate --cg`).
- Changing `fly.toml` VM size.
- Prioritizing contest submissions over practice ones.

## Decisions

### D1. Fixed pool of N long-lived worker tasks + one dispatcher
`main` spawns N `tokio` tasks. Each one loops: claim a submission → process; otherwise claim a validation → process; otherwise sleep until woken. The main task is the dispatcher. It owns the `PgListener`, runs the reaper on every wake, and calls `Notify::notify_waiters()` on a notification or a 60 s timeout.

*Alternative:* one dispatcher that claims jobs and `spawn`s each under a `Semaphore` permit. Rejected because box-id ownership then needs a separate slot pool. With long-lived workers, the worker index *is* the slot, and each worker keeps the old sequential "drain, then sleep" semantics.

### D2. Lost-wakeup safety via `Notified::enable()`
Before its drain pass, a worker creates and `enable()`s a `Notified` future. A `notify_waiters()` that lands between "claim returned None" and "await" is still observed. Workers have no timer of their own. The dispatcher's 60 s timeout wakes them for the sweep. If the dispatcher dies, `main` returns and the process exits, so workers can't be stranded.

### D3. Box ids: worker slot via `tokio::task_local!`
`isolate.rs` declares `task_local! { static WORKER_SLOT: u32 }`. Workers run each job inside `WORKER_SLOT.scope(slot, …)`. `alloc_box_id()` returns `slot` when it's set. Otherwise it falls back to the existing rotating counter, now restricted to `[MAX_WORKERS, 1000)`. Within one job, boxes are used strictly sequentially (compile box → per-test boxes, each init→run→cleanup), so one id per worker is enough. `box_init` already runs `--cleanup` before `--init`, which handles leftovers.

*Alternative:* pass the slot through `grade()` → `runner::prepare/execute` → `in_box`. Rejected because it changes `grade`'s signature, which another branch owns. The task-local doesn't touch those signatures at all.

### D4. Default N = min(available CPUs, 4), env clamp 1..=64
CPU-bound tests running at once on fewer cores slow each other's *wall* time. isolate's `--wall-time` is `2 × cpu + 1` s, so oversubscription risks spurious TLEs. Memory: rustc compiles and JVM runs can each take hundreds of MB of real RSS on the 2 GB VM, and the tmpfs box_root is 512 MB shared. Capping the default at 4 and tying it to CPU count keeps `shared-cpu-1x` at N = 1, the same behavior as today. Operators opt in with `JUDGE_CONCURRENCY` when they give the VM more cores.

### D5. Pool sizing
`DbClient::new` takes `max_connections = max(10, N + 2)`: one in-flight query per worker, plus the reaper, plus headroom. The `PgListener` uses its own connection.

### D6. Idle auto-stop = shared `active` counter + `last_activity` + DB check, then graceful drain
Shared `PoolState { active: AtomicUsize, last_activity: Mutex<Instant>, stopping: AtomicBool }`. Each claim attempt follows this order: `active += 1` → if `stopping`, `active -= 1` and exit → claim → process → `last_activity = now` → `active -= 1`. On every wake, the dispatcher checks three things: `active == 0`, `last_activity.elapsed() >= idle`, and `db.has_claimable_jobs()` returns false. If all hold, it sets `stopping`, wakes everyone, and `join`s all workers. A worker that slipped in a claim just before `stopping` was set gets to finish and save its job, because `join` waits for it. Nothing is left in `RUNNING`.

The DB check is needed because, in the old single loop, every wake drained *before* the idle check. The pool drains *after* the dispatcher wakes it, so a job that arrived with this very notification isn't visible in `active`/`last_activity` yet. The end-to-end smoke test caught exactly that: a notification arriving after the idle threshold made the judge exit and left 8 rows `PENDING`. `has_claimable_jobs` is a read-only `EXISTS` that shares its submission predicate with `get_next_submission` (`claimable_submission()`), so the two can't drift.

### D7. Measurement
An `#[ignore]`d test, `grade_tests::throughput_bench`, grades a fixed mixed batch (C, Python, Java; several test cases each) through `grade()`. It runs once with 1 slot and once with N slots (`BENCH_CONCURRENCY`, default 4) and prints jobs/s and the speedup. It runs inside the judge image like the rest of `grade_tests`. It measures the sandbox-bound part (the bottleneck). DB round trips are negligible next to it.

## Results

Measured on a 12-CPU dev host (Linux), judge image with isolate, release build. CPU limits were simulated with `docker --cpus`. The host was shared with other workloads, so expect ±10 % noise; one outlier run was discarded and repeated.

**Sandbox throughput** (`grade_tests::throughput_bench`, 48 jobs, mixed C / C++ / Python / Java, 5 test cases each):

| CPUs | slots | jobs/s | speedup |
|------|-------|--------|---------|
| 12 | 1 | 2.6–3.0 | 1.00× |
| 12 | 2 | 5.67 | 2.00× |
| 12 | 4 | 8.8–9.8 | 3.0–3.3× |
| 12 | 8 | 10.73 | 4.07× |
| 12 | 12 | 12.38 | 4.17× |
| 4 | 4 | 7.36 | 2.46× |
| 2 | 2 | 4.19 | 1.46× |
| 2 | 4 | 3.97 | 1.36× |
| 1 | 4 | 2.08 | 0.96× |

**End-to-end** (real Postgres 16, 40 PENDING submissions + 2 validations, a second wave of 8 delivered 45 s later by `pg_notify` alone, `JUDGE_IDLE_EXIT_SECS=20`):

| binary | workers | 40-job wall | wave-2 notify → last verdict | graded exactly once | idle exit |
|--------|---------|-------------|------------------------------|---------------------|-----------|
| `main` (before) | 1 | 11.83 s | 2.37 s | 48/48 | clean |
| this change | 1 | 12.13 s | 2.43 s | 48/48 | clean |
| this change | 4 | 3.86 s | 1.05 s | 48/48 | clean |
| this change | 8 | 3.31 s | 0.93 s | 48/48 | clean |

Takeaways: throughput scales with cores up to about 4 workers, then flattens, because isolate box setup and JVM start dominate. With one CPU there's no gain, which confirms D4 (default = CPU count). N = 1 matches the old judge, so the refactor adds no overhead.

## Risks / Trade-offs

- [Oversubscribed CPU → spurious TLE via wall-time] → Default tied to CPU count; documented that `JUDGE_CONCURRENCY` must not exceed vCPUs for CPU-heavy problems.
- [Aggregate memory (rustc/JVM) exceeding the VM's 2 GB → OOM kill of the judge] → Default cap of 4; stale-RUNNING reclaim + retry budget already recovers crashed jobs; documented.
- [tmpfs box_root (512 MB) filled by N concurrent boxes] → Boxes hold only source + small binaries; `ISOLATE_TMPFS_SIZE` is already tunable.
- [Interleaved logs across workers] → Prefix worker log lines with `[wN]`.
- [Fallback box-id range shrinks to `[64, 1000)`] → Only tests use it; still 936 ids.

## Migration Plan

Deploy as usual. With `JUDGE_CONCURRENCY` unset on `shared-cpu-1x`, N = 1, so behavior doesn't change. To scale: raise Fly `cpus`, then set `JUDGE_CONCURRENCY`. Rollback: unset the var or redeploy the previous image. There are no data changes.

## Open Questions

- Should the production VM move to `shared-cpu-2x`/`performance-2x` for contests? That's an ops/budget decision, outside this change.
