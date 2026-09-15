# Isolate Sandbox Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace judge's Docker sibling-container sandboxing with `isolate`, so judge no longer needs a host Docker daemon / `docker.sock`, opening up unprivileged deploy targets (e.g. Railway).

**Architecture:** `judge/src/runner.rs`'s per-language functions currently build a `sh -c` shell command string (base64-decode source → write → compile → run, with a stderr marker for compile-error detection) and hand it to `run_in_docker`, which spawns `docker run <image> sh -c <command>`. This plan keeps every per-language shell-command builder **completely unchanged** (same base64/marker mechanism) and swaps only the execution backend: a new `judge/src/isolate.rs` module wraps `isolate --box-id=N --init/--run/--cleanup`, and `run_in_docker` is replaced by `run_in_isolate`, which runs the exact same shell command string as `/bin/sh -c <command>` inside an isolate box instead of a Docker container. This is a deliberate simplification versus the design doc's literal "two separate isolate --run calls" wording — reusing the existing single shell-command-string mechanism unchanged means the six `run_<lang>` functions need almost no rewriting (just drop the per-language Docker image-name argument), and the compile-error-marker logic (`COMPILE_ERROR_MARKER`) carries over verbatim. All language toolchains move from separate pulled Docker images into the single judge image itself.

**Tech Stack:** Rust (tokio, existing `tempfile` dependency), `isolate` (built from source in a Docker multi-stage build), Docker (for building the judge image itself — judge no longer talks to a host Docker *daemon* at runtime, but the image is still built with `docker build`).

**Spec:** `docs/superpowers/specs/2026-09-15-isolate-sandbox-migration-design.md`

## Global Constraints

- No changes to `judge/src/main.rs`, `judge/src/db.rs`, `judge/src/models.rs`, DB schema, or job-claim/retry/DLQ/leaderboard logic (spec: Non-goals).
- All 6 languages (C, C++, Java, Python, Portugol, Rust) must keep working with equivalent compile-error/TLE/wrong-answer detection (spec: Goals).
- A per-language `--mem` (not a uniform 128MB) and a process-count cap replace the current `--memory 128m --cpus 0.5` Docker flags; no `--share-net` flag passed (isolate default = no network), matching current `--network none` (spec: Design). **Amended during Task 5 (ledgered ruling):** isolate's `--mem` is `RLIMIT_AS` (virtual address space), not real RSS — the JVM/rustc reserve far more virtual address space than they actually use. Python/C/C++ stay at 128MB (`DEFAULT_MEM_KB`); Rust needs 768MB (`RUST_MEM_KB`, dynamically-linked LLVM/rustc_driver); Java/Portugol need 2GB (`JVM_MEM_KB`, JVM startup reservation), with real usage still bounded via `-Xmx64m`-style flags passed through `JAVA_TOOL_OPTIONS`. See `.superpowers/sdd/2026-09-15-isolate-sandbox-migration/progress.md`'s Task 5 entry for the full empirical tuning evidence.
- `peak_memory_kb` must come from isolate's own meta-file `max-rss` field, not a polling approximation — `sample_peak_memory`/`parse_mem_to_kb` are deleted, not ported (spec: Goals).
- The Railway-unprivileged-viability question stays genuinely open after this plan — Task 1's smoke test validates the mechanism under best-case local privileges only, not Railway's actual constraints (spec: Risks & validation).

---

## Task 1: Build isolate into the judge image + smoke-test box lifecycle

**Files:**
- Modify: `judge/Dockerfile`
- Create: `judge/isolate.cfg` (isolate's `/usr/local/etc/isolate` config)
- Create: `judge/deploy/smoke-test-isolate.sh`

**Interfaces:**
- Produces: a `judge:isolate-dev` Docker image with a working `isolate` binary on `PATH`, and a config that bind-mounts `/usr`, `/bin`, `/lib`, `/lib64` (read-only) into every box so language toolchains installed system-wide are reachable from inside a box.

- [ ] **Step 1: Find the current isolate release tag**

Run:
```bash
git ls-remote --tags https://github.com/ioi/isolate.git | grep -v '\^{}' | sort -t/ -k3 -V | tail -5
```

Note the highest version tag printed (e.g. `v2.1`) — use it as `ISOLATE_TAG` in the Dockerfile step below instead of `main`, so the build is reproducible.

- [ ] **Step 2: Add an isolate-builder stage to the Dockerfile**

Edit `judge/Dockerfile`, adding a new stage before the existing `builder` stage (keep the existing Rust `builder` stage and final `debian` stage, just add this one and change what the final stage copies/installs):

```dockerfile
FROM debian:bookworm AS isolate-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libcap-dev git ca-certificates pkg-config \
    && rm -rf /var/lib/apt/lists/*
# Pin to the tag found in Step 1 instead of a moving branch.
RUN git clone --depth 1 --branch <ISOLATE_TAG_FROM_STEP_1> https://github.com/ioi/isolate.git /isolate
WORKDIR /isolate
RUN make isolate
```

- [ ] **Step 3: Write `judge/isolate.cfg`**

```ini
# Config for isolate boxes run inside the judge-worker container. The box
# filesystem is mostly empty by default; these `dir` lines bind-mount the
# toolchains installed in the judge image (python3, gcc/g++, rustc, JDK)
# so submitted-code compile/run commands can find them.
box_root = /var/local/lib/isolate
lock_root = /run/isolate/locks
cg_root = /sys/fs/cgroup
num_boxes = 1000

dir = /bin
dir = /lib
dir = /lib64
dir = /usr
dir = /opt:maybe
dir = /etc:noexec
```

- [ ] **Step 4: Update the final Dockerfile stage to install isolate**

Edit `judge/Dockerfile`'s final stage — replace the `docker.io` install with copying the isolate binary and config in:

```dockerfile
FROM debian:bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=isolate-builder /isolate/isolate /usr/local/bin/isolate
COPY judge/isolate.cfg /usr/local/etc/isolate

COPY --from=builder /app/target/release/judge /app/judge

CMD ["./judge"]
```

(Leave the existing Rust `builder` stage and its `COPY --from=builder` line as-is — only the base-image package list and the isolate copy are new here. Toolchain installs for python3/gcc/rustc/JDK are Task 5, not this task — this task only proves the isolate binary itself works.)

- [ ] **Step 5: Write the smoke-test script**

```bash
#!/usr/bin/env bash
# judge/deploy/smoke-test-isolate.sh
# Proves isolate's box init/run/cleanup cycle works inside the judge image
# under best-case local Docker privileges. Does NOT prove it works under
# Railway's (unknown, likely more restrictive) container constraints — see
# docs/superpowers/specs/2026-09-15-isolate-sandbox-migration-design.md,
# "Risks & validation".
set -euo pipefail

IMAGE="judge:isolate-dev"
docker build -t "$IMAGE" -f judge/Dockerfile judge

echo "--- isolate --version ---"
docker run --rm --cap-add=SYS_ADMIN "$IMAGE" isolate --version

echo "--- box init/run/cleanup ---"
docker run --rm --cap-add=SYS_ADMIN "$IMAGE" sh -c '
  set -e
  isolate --box-id=0 --init
  isolate --box-id=0 --run -- /bin/echo "hello from inside the box"
  isolate --box-id=0 --cleanup
'
echo "SMOKE TEST PASSED"
```

Run it: `chmod +x judge/deploy/smoke-test-isolate.sh && ./judge/deploy/smoke-test-isolate.sh`

Expected: `SMOKE TEST PASSED` printed, `hello from inside the box` echoed from the sandboxed run. If box init fails with a cgroup/permission error, iterate on `--cap-add` flags (try `--privileged` to isolate a config-vs-privilege problem) and record in the PR/commit message exactly which capability set was required — this is the concrete data point the Railway-viability question needs.

- [ ] **Step 6: Commit**

```bash
git add judge/Dockerfile judge/isolate.cfg judge/deploy/smoke-test-isolate.sh
git commit -m "feat(judge): build isolate into judge image, smoke-test box lifecycle"
```

---

## Task 2: `isolate.rs` meta-file parser (pure, unit-tested)

**Files:**
- Create: `judge/src/isolate.rs`
- Modify: `judge/src/main.rs:1-4` (add `mod isolate;`)

**Interfaces:**
- Produces: `pub struct IsolateMeta { time_secs: Option<f64>, wall_time_secs: Option<f64>, max_rss_kb: Option<i64>, exit_code: Option<i32>, status: Option<String>, message: Option<String> }` and `pub fn parse_meta(text: &str) -> IsolateMeta`, both consumed by Task 3.

- [ ] **Step 1: Write the failing tests**

Create `judge/src/isolate.rs`:

```rust
#[derive(Debug, Default, PartialEq)]
pub struct IsolateMeta {
    pub time_secs: Option<f64>,
    pub wall_time_secs: Option<f64>,
    pub max_rss_kb: Option<i64>,
    pub exit_code: Option<i32>,
    /// isolate's status code: "TO" (time limit exceeded), "SG" (killed by a
    /// signal), "RE" (nonzero exit), "XX" (internal isolate error). Absent
    /// entirely on a normal zero-exit run.
    pub status: Option<String>,
    pub message: Option<String>,
}

/// Parses isolate's `--meta=<file>` output: one `key:value` pair per line
/// (e.g. `time:0.012\nmax-rss:2384\nstatus:TO\n`). Unknown keys are ignored.
pub fn parse_meta(text: &str) -> IsolateMeta {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_a_normal_successful_run() {
        let text = "time:0.004\ntime-wall:0.012\nmax-rss:2384\nexitcode:0\n";
        let meta = parse_meta(text);
        assert_eq!(meta.time_secs, Some(0.004));
        assert_eq!(meta.wall_time_secs, Some(0.012));
        assert_eq!(meta.max_rss_kb, Some(2384));
        assert_eq!(meta.exit_code, Some(0));
        assert_eq!(meta.status, None);
    }

    #[test]
    fn parses_a_timeout() {
        let text = "time:5.000\ntime-wall:5.012\nmax-rss:1024\nstatus:TO\nmessage:Time limit exceeded\n";
        let meta = parse_meta(text);
        assert_eq!(meta.status.as_deref(), Some("TO"));
        assert_eq!(meta.message.as_deref(), Some("Time limit exceeded"));
    }

    #[test]
    fn ignores_unknown_keys() {
        let text = "time:0.001\ncg-mem:512\ncsw-voluntary:3\nexitcode:0\n";
        let meta = parse_meta(text);
        assert_eq!(meta.time_secs, Some(0.001));
        assert_eq!(meta.exit_code, Some(0));
    }

    #[test]
    fn empty_text_gives_all_none() {
        assert_eq!(parse_meta(""), IsolateMeta::default());
    }
}
```

Add `mod isolate;` to `judge/src/main.rs`'s module list (alongside the existing `mod constraints; mod db; mod models; mod runner;`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd judge && cargo test isolate::tests -- --nocapture`
Expected: panics with `not yet implemented` (from the `todo!()`).

- [ ] **Step 3: Implement `parse_meta`**

Replace the `todo!()` body:

```rust
pub fn parse_meta(text: &str) -> IsolateMeta {
    let mut meta = IsolateMeta::default();
    for line in text.lines() {
        let Some((key, value)) = line.split_once(':') else {
            continue;
        };
        match key {
            "time" => meta.time_secs = value.parse().ok(),
            "time-wall" => meta.wall_time_secs = value.parse().ok(),
            "max-rss" => meta.max_rss_kb = value.parse().ok(),
            "exitcode" => meta.exit_code = value.parse().ok(),
            "status" => meta.status = Some(value.to_string()),
            "message" => meta.message = Some(value.to_string()),
            _ => {}
        }
    }
    meta
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd judge && cargo test isolate::tests`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add judge/src/isolate.rs judge/src/main.rs
git commit -m "feat(judge): add isolate meta-file parser"
```

---

## Task 3: `isolate.rs` box lifecycle (init/run/cleanup)

**Files:**
- Modify: `judge/src/isolate.rs`

**Interfaces:**
- Consumes: `tempfile::NamedTempFile` (already a dependency), `IsolateMeta`/`parse_meta` from Task 2.
- Produces: `pub struct IsolateLimits { time_secs: u64, wall_time_secs: u64, mem_kb: u64, processes: u32 }`, `pub struct IsolateBox { id: u32, path: std::path::PathBuf }`, `pub async fn box_init() -> std::io::Result<IsolateBox>`, `pub async fn box_run(box_id: u32, limits: &IsolateLimits, stdin_path: Option<&str>, extra_dirs: &[&str], argv: &[&str]) -> std::io::Result<(std::process::Output, IsolateMeta)>`, `pub async fn box_cleanup(box_id: u32)` — all consumed by Task 4.

> **Ruling (from Task 1's findings, ledgered in `.superpowers/sdd/2026-09-15-isolate-sandbox-migration/progress.md`):** isolate v2.7 (the tag Task 1 actually built) has no `dir = ...` config-file directive — `judge/isolate.cfg` only sets `box_root`/`lock_root`/`cg_root`/`num_boxes`, and isolate's own built-in default rules already bind-mount `/bin`, `/lib`, `/lib64`, `/usr` read-only into every box with no config needed. Anything outside those paths (Task 5's Portugol jar lives at `/portugol`) must be passed per-run as an `isolate --run --dir=<path>` flag. `box_run` therefore takes an `extra_dirs: &[&str]` parameter (empty for every language except Portugol) instead of relying on config-file-wide directory exposure as originally planned.

- [ ] **Step 1: Add the types and box lifecycle functions**

Append to `judge/src/isolate.rs` (this task has no meaningful unit-testable surface without the real `isolate` binary + root/cgroup privileges — the docker-image smoke test in Task 1 and the full end-to-end test in Task 5 are this task's verification, per the "Testing" section of the design spec):

```rust
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::atomic::{AtomicU32, Ordering};
use tokio::fs;
use tokio::process::Command;

/// isolate box ids range 0..1000 (see `num_boxes` in `judge/isolate.cfg`). A
/// process-local counter is enough: `process_job` in main.rs runs test cases
/// strictly sequentially within one submission, and each judge-worker
/// replica is its own OS process / cgroup hierarchy (judge/CLAUDE.md's
/// multi-replica note) — no cross-process coordination needed.
static NEXT_BOX_ID: AtomicU32 = AtomicU32::new(0);

fn alloc_box_id() -> u32 {
    NEXT_BOX_ID.fetch_add(1, Ordering::Relaxed) % 1000
}

pub struct IsolateLimits {
    pub time_secs: u64,
    pub wall_time_secs: u64,
    pub mem_kb: u64,
    pub processes: u32,
}

pub struct IsolateBox {
    pub id: u32,
    /// The box's working directory (`<box_root>/<id>/box`), where the
    /// sandboxed shell command actually executes and where its relative
    /// file writes (source files, stdin file) land.
    pub path: PathBuf,
}

pub async fn box_init() -> std::io::Result<IsolateBox> {
    let id = alloc_box_id();
    let output = Command::new("isolate")
        .args(["--box-id", &id.to_string(), "--init"])
        .output()
        .await?;

    if !output.status.success() {
        return Err(std::io::Error::other(format!(
            "isolate --init failed for box {}: {}",
            id,
            String::from_utf8_lossy(&output.stderr)
        )));
    }

    let root = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(IsolateBox {
        id,
        path: PathBuf::from(root).join("box"),
    })
}

/// Runs `argv` inside `box_id` under `limits`, with `stdin_path` (a filename
/// relative to the box's working directory, written by the caller first) as
/// stdin. Returns the raw process output (for stdout/stderr) and isolate's
/// parsed resource-usage report.
pub async fn box_run(
    box_id: u32,
    limits: &IsolateLimits,
    stdin_path: Option<&str>,
    extra_dirs: &[&str],
    argv: &[&str],
) -> std::io::Result<(std::process::Output, super::isolate::IsolateMeta)> {
    let meta_file = tempfile::NamedTempFile::new()?;
    let meta_path = meta_file.path().to_path_buf();

    let mut cmd = Command::new("isolate");
    cmd.args(["--box-id", &box_id.to_string()])
        .arg(format!("--time={}", limits.time_secs))
        .arg(format!("--wall-time={}", limits.wall_time_secs))
        .arg(format!("--mem={}", limits.mem_kb))
        .arg(format!("--processes={}", limits.processes))
        .arg(format!("--meta={}", meta_path.display()));

    if let Some(stdin) = stdin_path {
        cmd.arg(format!("--stdin={}", stdin));
    }

    // Directories beyond isolate's built-in defaults (/bin, /lib, /lib64,
    // /usr — see the ruling above this code block) that this run needs
    // visible inside the box, e.g. Portugol's jar at /portugol.
    for dir in extra_dirs {
        cmd.arg(format!("--dir={}", dir));
    }

    cmd.arg("--run").arg("--").args(argv);
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    let output = cmd.output().await?;
    let meta_text = fs::read_to_string(&meta_path).await.unwrap_or_default();
    let meta = parse_meta(&meta_text);

    Ok((output, meta))
}

/// Best-effort: a failed cleanup leaks one box slot (of 1000) until the
/// judge-worker process restarts — not worth failing the caller over.
pub async fn box_cleanup(box_id: u32) {
    let _ = Command::new("isolate")
        .args(["--box-id", &box_id.to_string(), "--cleanup"])
        .output()
        .await;
}
```

Fix the self-referential `super::isolate::IsolateMeta` typo in `box_run`'s signature — since this is written inside `isolate.rs` itself, it should just be `IsolateMeta`:

- [ ] **Step 2: Fix the type path and build**

Edit the `box_run` signature to read:
```rust
) -> std::io::Result<(std::process::Output, IsolateMeta)> {
```

Run: `cd judge && cargo build`
Expected: compiles clean (this module isn't wired into `runner.rs` yet, so no behavior to test beyond compilation).

- [ ] **Step 3: Commit**

```bash
git add judge/src/isolate.rs
git commit -m "feat(judge): add isolate box lifecycle (init/run/cleanup)"
```

---

## Task 4: Rewire `runner.rs` onto `isolate.rs`

**Files:**
- Modify: `judge/src/runner.rs` (entire file)

**Interfaces:**
- Consumes: `isolate::{box_init, box_run, box_cleanup, IsolateLimits}` from Tasks 2-3.
- Produces: `pub async fn run(code: &str, input_data: &str, language: Language, time_limit_secs: u64) -> ExecutionResult` — unchanged signature, consumed by `main.rs::grade` (Task 5 verifies this end-to-end). `run_in_isolate` takes an added `extra_dirs: &[&str]` parameter (see Task 3's ruling note) — every `run_<lang>` passes `&[]` except `run_portugol`, which passes `&["/portugol"]` so the box can see the jar Task 5 installs there.

- [ ] **Step 1: Delete Docker-specific code, add `run_in_isolate`**

In `judge/src/runner.rs`:
- Delete `sample_peak_memory`, `parse_mem_to_kb`, and `run_in_docker` (lines 163-354 in the current file).
- Delete the now-unused imports this leaves behind: `std::sync::Arc`, `std::sync::atomic::{AtomicI64, Ordering}`, `tokio::time::interval`, `uuid::Uuid`. Keep `std::process::Stdio`, `std::time::{Duration, Instant}`, `tokio::time::timeout`.
- Add, replacing the deleted functions:

```rust
async fn run_in_isolate(
    shell_command: &str,
    input_data: &str,
    time_limit_secs: u64,
    extra_dirs: &[&str],
) -> ExecutionResult {
    println!("   🔒 Running in isolate sandbox");
    let started_at = Instant::now();

    let sandbox_box = match crate::isolate::box_init().await {
        Ok(b) => b,
        Err(e) => {
            eprintln!("Failed to init isolate box: {}", e);
            return ExecutionResult {
                stdout: String::new(),
                stderr: format!("Internal error: failed to start runner ({})", e),
                exit_code: -1,
                is_timeout: false,
                is_compile_error: false,
                duration_ms: started_at.elapsed().as_millis() as i64,
                peak_memory_kb: None,
            };
        }
    };

    let stdin_file = "stdin.txt";
    if let Err(e) = tokio::fs::write(sandbox_box.path.join(stdin_file), input_data).await {
        crate::isolate::box_cleanup(sandbox_box.id).await;
        eprintln!("Failed to write sandbox stdin: {}", e);
        return ExecutionResult {
            stdout: String::new(),
            stderr: format!("Internal error: failed to prepare runner input ({})", e),
            exit_code: -1,
            is_timeout: false,
            is_compile_error: false,
            duration_ms: started_at.elapsed().as_millis() as i64,
            peak_memory_kb: None,
        };
    }

    let limits = crate::isolate::IsolateLimits {
        time_secs: time_limit_secs,
        wall_time_secs: time_limit_secs + 2,
        mem_kb: 131_072, // 128MB, matches the previous `docker run --memory 128m`
        processes: 64,   // fork-bomb cap; new, additive safety property vs the Docker version
    };

    let run_result = timeout(
        Duration::from_secs(time_limit_secs + 5),
        crate::isolate::box_run(
            sandbox_box.id,
            &limits,
            Some(stdin_file),
            extra_dirs,
            &["/bin/sh", "-c", shell_command],
        ),
    )
    .await;

    let box_id = sandbox_box.id;
    crate::isolate::box_cleanup(box_id).await;

    match run_result {
        Ok(Ok((output, meta))) => {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let is_compile_error = stderr.contains(COMPILE_ERROR_MARKER);
            let stderr = if is_compile_error {
                stderr.replace(COMPILE_ERROR_MARKER, "").trim().to_string()
            } else {
                stderr
            };
            let is_timeout = meta.status.as_deref() == Some("TO");

            ExecutionResult {
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: if is_timeout {
                    "Time Limit Exceeded".to_string()
                } else {
                    stderr
                },
                exit_code: if is_timeout {
                    124
                } else {
                    meta.exit_code.unwrap_or_else(|| output.status.code().unwrap_or(-1))
                },
                is_timeout,
                is_compile_error: is_compile_error && !is_timeout,
                duration_ms: started_at.elapsed().as_millis() as i64,
                peak_memory_kb: meta.max_rss_kb,
            }
        }
        Ok(Err(e)) => {
            eprintln!("Failed to run isolate box: {}", e);
            ExecutionResult {
                stdout: String::new(),
                stderr: format!("Internal error: failed to read runner output ({})", e),
                exit_code: -1,
                is_timeout: false,
                is_compile_error: false,
                duration_ms: started_at.elapsed().as_millis() as i64,
                peak_memory_kb: None,
            }
        }
        Err(_) => {
            println!("\t⏳ Time Limit Exceeded! (outer watchdog)");
            ExecutionResult {
                stdout: String::new(),
                stderr: "Time Limit Exceeded".to_string(),
                exit_code: 124,
                is_timeout: true,
                is_compile_error: false,
                duration_ms: started_at.elapsed().as_millis() as i64,
                peak_memory_kb: None,
            }
        }
    }
}
```

(The outer `tokio::time::timeout` stays as a watchdog in case `isolate --run` itself hangs despite its own `--wall-time`, mirroring how the previous Docker version relied on the outer timeout as the *only* enforcement — now it's a backstop, isolate's own `--wall-time`/status:TO is the primary path.)

- [ ] **Step 2: Update every `run_<lang>` function to call `run_in_isolate`**

Each function currently ends with a call to `run_in_docker(<image>, &shell_command, input_data, time_limit_secs)`. Change each to `run_in_isolate(&shell_command, input_data, time_limit_secs, &[])` — dropping the image-name argument, passing an empty `extra_dirs` slice, keeping the shell-command construction above it completely unchanged. E.g. `run_python`:

```rust
pub async fn run_python(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = format!(
        "echo \"{}\" | base64 -d > script.py && python3 script.py",
        b64_code
    );

    run_in_isolate(&shell_command, input_data, time_limit_secs, &[]).await
}
```

Apply the same pattern (delete the image-name string literal, call `run_in_isolate` instead of `run_in_docker`, pass `&[]` for `extra_dirs`) to `run_cpp`, `run_c`, `run_java`, `run_rust`. Also update `run_portugol`'s call site, which passes `&normalized_input` (unchanged) — but `run_portugol` passes `&["/portugol"]` instead of `&[]` for `extra_dirs`, since the Portugol console jar (installed at `/portugol/portugol-console.jar` in Task 5) lives outside isolate's built-in default-visible directories (`/bin`, `/lib`, `/lib64`, `/usr` — see Task 3's ruling note) and needs an explicit `--dir=/portugol` to be reachable from inside the box:

```rust
pub async fn run_portugol(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = format!(
        "echo \"{}\" | base64 -d > script.por && java -jar /portugol/portugol-console.jar -no-wait script.por",
        b64_code
    );

    let normalized_input = input_data.split_whitespace().collect::<Vec<_>>().join("\n");
    run_in_isolate(&shell_command, &normalized_input, time_limit_secs, &["/portugol"]).await
}
```

- [ ] **Step 3: Also strip the now-unused `ExecutionResult` doc comment**

`ExecutionResult::peak_memory_kb`'s doc comment currently explains the `docker stats` sampling approximation — update it since that's no longer true:

```rust
    /// Peak resident memory in KB, as reported by isolate's `max-rss` field
    /// in its `--meta` output (a real kernel-reported cgroup peak, not an
    /// approximation). `None` if the box failed to start before any run.
    pub peak_memory_kb: Option<i64>,
```

- [ ] **Step 4: Build**

Run: `cd judge && cargo build`
Expected: compiles clean. (Behavioral verification — actually running each language through a real isolate box — is Task 5, once the image has the toolchains installed.)

- [ ] **Step 5: Commit**

```bash
git add judge/src/runner.rs
git commit -m "feat(judge): rewire runner.rs from Docker to isolate"
```

---

## Task 5: Install language toolchains in the judge image, run full test suite

**Files:**
- Modify: `judge/Dockerfile`
- Modify: `judge/src/main.rs:396-453` (extend `grade_tests`)

**Interfaces:**
- Consumes: `run` from `runner.rs` (Task 4), `grade` from `main.rs` (unchanged).

- [ ] **Step 1: Install toolchains in the Dockerfile's final stage**

Edit the final stage of `judge/Dockerfile` (from Task 1) to add every language runtime instead of relying on separate pulled images:

```dockerfile
FROM debian:bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    gcc g++ \
    rustc \
    openjdk-21-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

COPY --from=isolate-builder /isolate/isolate /usr/local/bin/isolate
COPY judge/isolate.cfg /usr/local/etc/isolate

# Portugol runtime: the console jar + its ANTLR/audio lib dependencies,
# previously baked into the separate `portugol:latest` image built from
# judge/portugol/Dockerfile — that image and its build step go away (Task 6),
# the jar now lives directly in this image instead.
COPY judge/portugol/portugol-console-2.7.5.jar /portugol/portugol-console.jar
COPY judge/portugol/lib /portugol/lib

COPY --from=builder /app/target/release/judge /app/judge

CMD ["./judge"]
```

- [ ] **Step 2: Update `run_portugol`'s classpath if needed**

Check `judge/portugol/Dockerfile` for how the jar was originally launched (it may need `-cp` including `/portugol/lib/*` rather than a bare `-jar`). Read it:

Run: `cat judge/portugol/Dockerfile`

If it shows a `-cp /portugol/lib/*:/portugol/portugol-console.jar` style invocation rather than the bare `java -jar` currently in `runner.rs::run_portugol`, update `run_portugol`'s `shell_command` to match that exact classpath invocation instead of `-jar`.

- [ ] **Step 3: Extend `grade_tests` in `main.rs` to cover every language**

The existing tests only exercise Python and C. Add, after `compile_error_stops_immediately_regardless_of_run_all`:

```rust
    #[tokio::test]
    async fn every_language_can_pass_a_trivial_echo() {
        let cases: &[(Language, &str)] = &[
            (Language::Python, "print(input())"),
            (Language::C, "#include <stdio.h>\nint main(){int x;scanf(\"%d\",&x);printf(\"%d\\n\",x);return 0;}"),
            (Language::Cpp, "#include <iostream>\nint main(){int x;std::cin>>x;std::cout<<x<<std::endl;return 0;}"),
            (Language::Rust, "use std::io::*;\nfn main(){let mut s=String::new();stdin().read_line(&mut s).unwrap();print!(\"{}\",s.trim());}"),
            (Language::Java, "import java.util.Scanner;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);System.out.println(sc.nextInt());}}"),
        ];

        let p = problem(&["7"], &["7"]);
        for (lang, code) in cases {
            let (report, _, _) = grade(code, *lang, &p, false).await;
            assert!(report.passed, "{:?} should pass a trivial echo, got: {:?}", lang, report.failure_details);
        }
    }

    #[tokio::test]
    async fn portugol_can_pass_a_trivial_echo() {
        // Separate from `every_language_can_pass_a_trivial_echo` because
        // Portugol needs Portugol syntax, not a shared echo snippet, and its
        // input goes through the space/newline normalization in
        // `run_portugol` before reaching the box's stdin file.
        let p = problem(&["7"], &["7"]);
        let code = "programa {\n\tfuncao inicio() {\n\t\tinteiro x\n\t\tleia(x)\n\t\tescreva(x)\n\t}\n}";
        let (report, _, _) = grade(code, Language::Portugol, &p, false).await;
        assert!(report.passed, "Portugol should pass a trivial echo, got: {:?}", report.failure_details);
    }

    #[tokio::test]
    async fn fork_bomb_is_capped_by_processes_limit() {
        // Python fork bomb via os.fork() in a loop — should hit isolate's
        // --processes=64 cap and fail (crash/killed), not hang the box or
        // spill into the host beyond the box's own cgroup.
        let p = problem(&["1"], &["1"]);
        let code = "import os\nwhile True: os.fork()";
        let (report, _, _) = grade(code, Language::Python, &p, false).await;
        assert!(!report.passed, "fork bomb should fail under the box's --processes cap, not pass or hang");
    }

    #[tokio::test]
    async fn tle_is_detected_via_isolate_wall_time() {
        // Python busy-loop with no output — must be killed by isolate's
        // --wall-time, not just hang until the crate's own 20s+5s watchdog.
        let p = problem(&["1"], &["1"]);
        let code = "while True: pass";
        let (report, _, _) = grade(code, Language::Python, &p, false).await;
        assert!(!report.passed);
        let details = report.failure_details.unwrap();
        assert!(details.error.unwrap_or_default().contains("Time Limit"));
    }

    #[tokio::test]
    async fn memory_cap_is_enforced() {
        // Allocates far more than the 128MB box limit — should fail, not hang
        // or silently succeed with an OOM'd process reporting exit 0.
        let p = problem(&["1"], &["1"]);
        let code = "x = bytearray(500 * 1024 * 1024)\nprint(input())";
        let (report, _, _) = grade(code, Language::Python, &p, false).await;
        assert!(!report.passed, "500MB allocation should fail under the 128MB box limit");
    }
```

- [ ] **Step 4: Run the full test suite inside the built image**

These tests shell out to the real `isolate` binary (same as the old ones shelled out to real `docker`), so they must run inside the built judge image, not on the bare host:

```bash
docker build -t judge:isolate-dev -f judge/Dockerfile judge
docker run --rm --cap-add=SYS_ADMIN --cap-add=NET_ADMIN -v "$(pwd)/judge":/src -w /src judge:isolate-dev \
  sh -c "apt-get update && apt-get install -y curl && curl https://sh.rustup.rs -sSf | sh -s -- -y && . \$HOME/.cargo/env && cargo test"
```

(This installs a Rust toolchain inside the running container just to invoke `cargo test` there — the shipped image itself doesn't need Rust at runtime, only its build stage did. If this proves too slow/awkward in practice, an acceptable alternative is building a one-off `judge:test` image whose final stage is the `builder` stage itself, i.e. `docker build --target builder -t judge:test -f judge/Dockerfile judge && docker run --rm --cap-add=SYS_ADMIN --cap-add=NET_ADMIN judge:test cargo test`, which has both the Rust toolchain and — once Step 1 is also present in that stage — the isolate binary. Use `--cap-add=SYS_ADMIN --cap-add=NET_ADMIN` — the exact minimal capability set Task 1's smoke test found necessary (`SYS_ADMIN` alone gets `--init` working but `--run` fails bringing up the box's loopback interface without `NET_ADMIN`).)

Expected: all tests pass, including the 5 new ones. If any language-specific test fails on a "not found"/permission error for a toolchain path, the likely cause is that path falling outside isolate's built-in default-visible directories (`/bin`, `/lib`, `/lib64`, `/usr` — see Task 3's ruling note; `judge/isolate.cfg` itself has no `dir` lines in this isolate release) — check whether that language's `run_<lang>` needs its own `--dir=` addition the way `run_portugol` already gets `extra_dirs: &["/portugol"]`, rather than assuming a config-file fix.

- [ ] **Step 5: Commit**

```bash
git add judge/Dockerfile judge/src/main.rs
git commit -m "feat(judge): bundle language toolchains in judge image, extend test coverage"
```

---

## Task 6: Update compose files — drop docker.sock and the portugol image build

**Files:**
- Modify: `judge/compose.yml`
- Modify: `judge/compose.prod.yml`

**Interfaces:**
- Consumes: the capability requirement Task 1's smoke test determined necessary — `cap_add: [SYS_ADMIN, NET_ADMIN]` (confirmed by Task 1's report: `SYS_ADMIN` alone inits a box but `--run` fails bringing up its loopback interface without `NET_ADMIN`; `--privileged` was not needed).

- [ ] **Step 1: Update `judge/compose.yml`**

Remove the `portugol` service and the `docker.sock` volume mount, add both capability flags Task 1 found necessary:

```yaml
services:
  judge-worker:
    build:
      context: .
      dockerfile: Dockerfile
    cap_add:
      - SYS_ADMIN
      - NET_ADMIN
    env_file:
      - .env
    restart: on-failure
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:latest
    environment:
      POSTGRES_USER: judge
      POSTGRES_PASSWORD: judge
      POSTGRES_DB: judge
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U judge -d judge"]
      interval: 2s
      timeout: 3s
      retries: 10
```

- [ ] **Step 2: Update `judge/compose.prod.yml`**

Same shape — remove the `portugol` service block and the `docker.sock` volume mount, add the same `cap_add` lines:

```yaml
services:
  judge-worker:
    build: .
    cap_add:
      - SYS_ADMIN
      - NET_ADMIN
    env_file:
      - .env
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

- [ ] **Step 3: Verify locally**

Run: `cd judge && docker compose up -d --build && docker compose logs -f judge-worker`
Expected: judge-worker starts, connects to DB, logs "Listening for 'new_submission'..." with no docker.sock-related errors (there should be none to have, since nothing references it anymore).

Run: `docker compose down`

- [ ] **Step 4: Commit**

```bash
git add judge/compose.yml judge/compose.prod.yml
git commit -m "chore(judge): drop docker.sock dependency and portugol image build from compose"
```

---

## Task 7: Update docs (`judge/CLAUDE.md`, `judge/deploy/README.md`)

**Files:**
- Modify: `judge/CLAUDE.md`
- Modify: `judge/deploy/README.md`

- [ ] **Step 1: Update `judge/CLAUDE.md`**

Replace the "Docker-in-Docker" section (currently describing the sibling-container pattern) with:

```markdown
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

All language toolchains (python3, gcc/g++, rustc, JDK 21, the Portugol
console jar) are installed directly in the judge image (see `Dockerfile`)
rather than pulled as separate per-language Docker images at runtime —
`isolate.cfg`'s `dir` lines bind-mount `/usr`, `/bin`, `/lib`, `/lib64`
(read-only) into every box so these toolchains are reachable from inside
a sandboxed run.

isolate needs elevated container capabilities to manage its own cgroups/
namespaces (see `compose.yml`'s `cap_add`/`privileged` setting, determined
by `judge/deploy/smoke-test-isolate.sh`) — this is a real container
capability requirement, separate from (and much narrower than) the old
Docker-socket-mount approach, which needed full host Docker daemon access.
```

- [ ] **Step 2: Update `judge/deploy/README.md`**

Replace the "Install Docker" / docker.sock-mount framing (from the earlier VPS deploy work) with: judge no longer needs a *host* Docker daemon at runtime — only whatever the deployed platform needs to run the judge container itself with the capability found in Task 1 (`cap_add: SYS_ADMIN` or `privileged: true`). Add a note that Railway viability is still unconfirmed pending an actual deploy attempt there, since Task 1's smoke test only validated the mechanism under local Docker with elevated caps, not Railway's specific (unknown) constraints.

- [ ] **Step 3: Commit**

```bash
git add judge/CLAUDE.md judge/deploy/README.md
git commit -m "docs(judge): document isolate sandboxing, update deploy README"
```
