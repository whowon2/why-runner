use std::path::PathBuf;
use std::process::Stdio;
use std::sync::atomic::{AtomicU32, Ordering};
use tokio::fs;
use tokio::process::Command;

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
) -> std::io::Result<(std::process::Output, IsolateMeta)> {
    let meta_file = tempfile::NamedTempFile::new()?;
    let meta_path = meta_file.path().to_path_buf();

    let mut cmd = Command::new("isolate");
    cmd.args(["--box-id", &box_id.to_string()])
        .arg(format!("--time={}", limits.time_secs))
        .arg(format!("--wall-time={}", limits.wall_time_secs))
        .arg(format!("--mem={}", limits.mem_kb))
        .arg(format!("--processes={}", limits.processes))
        .arg(format!("--meta={}", meta_path.display()))
        // isolate's --run starts the boxed process with an environment that
        // is *entirely* empty (no PATH at all — confirmed by dumping `env`
        // inside a box). `/bin/sh` still resolves bare commands like `gcc`
        // via its own compiled-in default search list even without a PATH
        // in its environment, but that default is never exported to child
        // processes: gcc's own collect2 step execve()s `ld` by searching
        // COMPILER_PATH (which doesn't include /usr/bin) and then $PATH from
        // its environment, and with no PATH there it fails with
        // "cannot find 'ld'" — nondeterministically, since a run started
        // via `sh -c 'gcc -v ...'` prints its own diagnostic PATH-shaped
        // strings that can look misleadingly like a fix. Setting PATH
        // explicitly here fixes it for every language, not just gcc/g++.
        .arg("--env=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");

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
        let text =
            "time:5.000\ntime-wall:5.012\nmax-rss:1024\nstatus:TO\nmessage:Time limit exceeded\n";
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
