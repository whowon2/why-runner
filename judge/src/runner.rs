use crate::models::Language;
use base64::{Engine as _, engine::general_purpose};
use std::process::Stdio;
use std::sync::Arc;
use std::sync::atomic::{AtomicI64, Ordering};
use std::time::{Duration, Instant};
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::time::{interval, timeout};
use uuid::Uuid;

const COMPILE_ERROR_MARKER: &str = "##COMPILE_ERROR##";

pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub is_timeout: bool,
    pub is_compile_error: bool,
    pub duration_ms: i64,
    /// Peak resident memory observed via periodic `docker stats` sampling
    /// while the sandbox container was running. This is a sampled
    /// approximation (not a true cgroup peak-usage counter), since `--rm`
    /// containers don't retain stats after exit and reading cgroup
    /// peak-usage files directly would be fragile across cgroup v1/v2 and
    /// Docker storage/cgroup driver configurations. `None` if sampling
    /// failed (e.g. `docker stats` unavailable) or the container exited
    /// before any sample was taken.
    pub peak_memory_kb: Option<i64>,
}

/// Wraps a compile step and a run step so compile failures are distinguishable
/// from the compiled program's own runtime failures. The compiler's stderr is
/// captured, and on non-zero compile exit the marker is emitted to stderr and
/// the run step is skipped entirely.
fn compile_and_run_command(write_source: &str, compile_cmd: &str, run_cmd: &str) -> String {
    format!(
        "{write} && {compile} 2>compile.log; ec=$?; if [ $ec -ne 0 ]; then cat compile.log >&2; echo '{marker}' >&2; exit 1; fi; {run}",
        write = write_source,
        compile = compile_cmd,
        marker = COMPILE_ERROR_MARKER,
        run = run_cmd,
    )
}

pub async fn run(
    code: &str,
    input_data: &str,
    language: Language,
    time_limit_secs: u64,
) -> ExecutionResult {
    match language {
        Language::Python => run_python(code, input_data, time_limit_secs).await,
        Language::Rust => run_rust(code, input_data, time_limit_secs).await,
        Language::Cpp => run_cpp(code, input_data, time_limit_secs).await,
        Language::Portugol => run_portugol(code, input_data, time_limit_secs).await,
        Language::C => run_c(code, input_data, time_limit_secs).await,
        Language::Java => run_java(code, input_data, time_limit_secs).await,
    }
}

pub async fn run_python(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = format!(
        "echo \"{}\" | base64 -d > script.py && python3 script.py",
        b64_code
    );

    run_in_docker(
        "python:3.9-slim",
        &shell_command,
        input_data,
        time_limit_secs,
    )
    .await
}

pub async fn run_portugol(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = format!(
        "echo \"{}\" | base64 -d > script.por && java -jar /portugol/portugol-console.jar -no-wait script.por",
        b64_code
    );

    let normalized_input = input_data.split_whitespace().collect::<Vec<_>>().join("\n");
    run_in_docker(
        "portugol:latest",
        &shell_command,
        &normalized_input,
        time_limit_secs,
    )
    .await
}

pub async fn run_cpp(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = compile_and_run_command(
        &format!("echo \"{}\" | base64 -d > solution.cpp", b64_code),
        "g++ -o program solution.cpp",
        "./program",
    );

    run_in_docker(
        "gcc:13-bookworm",
        &shell_command,
        input_data,
        time_limit_secs,
    )
    .await
}

pub async fn run_c(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = compile_and_run_command(
        &format!("echo \"{}\" | base64 -d > solution.c", b64_code),
        "gcc -o program solution.c",
        "./program",
    );

    run_in_docker(
        "gcc:13-bookworm",
        &shell_command,
        input_data,
        time_limit_secs,
    )
    .await
}

pub async fn run_java(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = compile_and_run_command(
        &format!("echo \"{}\" | base64 -d > Main.java", b64_code),
        "javac Main.java",
        "java Main",
    );

    run_in_docker(
        "eclipse-temurin:21-jdk",
        &shell_command,
        input_data,
        time_limit_secs,
    )
    .await
}

pub async fn run_rust(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = compile_and_run_command(
        &format!("echo \"{}\" | base64 -d > script.rs", b64_code),
        "rustc script.rs -o program",
        "./program",
    );

    run_in_docker(
        "rust:1.80-slim",
        &shell_command,
        input_data,
        time_limit_secs,
    )
    .await
}

/// Polls `docker stats` for `container_name` every 50ms and keeps a running
/// max of the reported memory usage (converted to KB) in `peak_kb`. Runs
/// until `stop` is set to true. Best-effort: a sample that fails to run or
/// parse is silently skipped, since a single missed sample just narrows the
/// approximation, not a correctness issue for the caller.
async fn sample_peak_memory(
    container_name: String,
    peak_kb: Arc<AtomicI64>,
    stop: Arc<std::sync::atomic::AtomicBool>,
) {
    let mut ticker = interval(Duration::from_millis(50));
    while !stop.load(Ordering::Relaxed) {
        ticker.tick().await;

        let output = Command::new("docker")
            .args(&[
                "stats",
                "--no-stream",
                "--format",
                "{{.MemUsage}}",
                &container_name,
            ])
            .output()
            .await;

        let Ok(output) = output else { continue };
        if !output.status.success() {
            continue;
        }

        let text = String::from_utf8_lossy(&output.stdout);
        let Some(used_part) = text.split('/').next() else {
            continue;
        };

        if let Some(kb) = parse_mem_to_kb(used_part.trim()) {
            peak_kb.fetch_max(kb, Ordering::Relaxed);
        }
    }
}

/// Parses a docker-formatted memory size like "12.34MiB" / "512KiB" / "1.2GiB"
/// into whole kilobytes.
fn parse_mem_to_kb(text: &str) -> Option<i64> {
    let (number_part, unit) =
        text.split_at(text.find(|c: char| c.is_alphabetic()).unwrap_or(text.len()));
    let value: f64 = number_part.trim().parse().ok()?;

    let kb = match unit.trim() {
        "GiB" => value * 1024.0 * 1024.0,
        "MiB" => value * 1024.0,
        "KiB" => value,
        "B" => value / 1024.0,
        _ => return None,
    };

    Some(kb as i64)
}

async fn run_in_docker(
    image: &str,
    shell_command: &str,
    input_data: &str,
    time_limit_secs: u64,
) -> ExecutionResult {
    println!("   🐳 Spawning Docker Container ({})", image);

    let started_at = Instant::now();
    let container_name = format!("judge-{}", Uuid::new_v4());

    let mut child = match Command::new("docker")
        .args(&[
            "run",
            "--name",
            &container_name,
            "-i",
            "--network",
            "none",
            "--memory",
            "128m",
            "--cpus",
            "0.5",
            image,
            "sh",
            "-c",
            shell_command,
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to spawn Docker container: {}", e);
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

    if let Some(mut stdin) = child.stdin.take() {
        let input_bytes = input_data.as_bytes().to_vec();
        tokio::spawn(async move {
            stdin.write_all(&input_bytes).await.ok();
        });
    }

    let peak_kb = Arc::new(AtomicI64::new(0));
    let stop_sampling = Arc::new(std::sync::atomic::AtomicBool::new(false));
    let sampler = tokio::spawn(sample_peak_memory(
        container_name.clone(),
        peak_kb.clone(),
        stop_sampling.clone(),
    ));

    let duration = Duration::from_secs(time_limit_secs);
    let wait_result = timeout(duration, child.wait_with_output()).await;

    stop_sampling.store(true, Ordering::Relaxed);
    sampler.abort();

    // Container is created without --rm (needed so the sampler above can
    // read stats after the process exits but before removal); clean it up
    // ourselves in every branch below.
    let cleanup_name = container_name.clone();
    tokio::spawn(async move {
        Command::new("docker")
            .args(&["rm", "-f", &cleanup_name])
            .output()
            .await
            .ok();
    });

    let peak_memory_kb = match peak_kb.load(Ordering::Relaxed) {
        0 => None,
        kb => Some(kb),
    };

    match wait_result {
        Ok(Ok(output)) => {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let is_compile_error = stderr.contains(COMPILE_ERROR_MARKER);
            let stderr = if is_compile_error {
                stderr.replace(COMPILE_ERROR_MARKER, "").trim().to_string()
            } else {
                stderr
            };

            ExecutionResult {
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr,
                exit_code: output.status.code().unwrap_or(-1),
                is_timeout: false,
                is_compile_error,
                duration_ms: started_at.elapsed().as_millis() as i64,
                peak_memory_kb,
            }
        }
        Ok(Err(e)) => {
            eprintln!("Failed to read container output: {}", e);
            ExecutionResult {
                stdout: String::new(),
                stderr: format!("Internal error: failed to read runner output ({})", e),
                exit_code: -1,
                is_timeout: false,
                is_compile_error: false,
                duration_ms: started_at.elapsed().as_millis() as i64,
                peak_memory_kb,
            }
        }
        Err(_) => {
            println!("\t⏳ Time Limit Exceeded! Killing container...");
            ExecutionResult {
                stdout: String::new(),
                stderr: "Time Limit Exceeded".to_string(),
                exit_code: 124,
                is_timeout: true,
                is_compile_error: false,
                duration_ms: started_at.elapsed().as_millis() as i64,
                peak_memory_kb,
            }
        }
    }
}
