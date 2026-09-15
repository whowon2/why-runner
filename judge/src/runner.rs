use crate::models::Language;
use base64::{Engine as _, engine::general_purpose};
use std::time::{Duration, Instant};
use tokio::time::timeout;

const COMPILE_ERROR_MARKER: &str = "##COMPILE_ERROR##";

pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub is_timeout: bool,
    pub is_compile_error: bool,
    pub duration_ms: i64,
    /// Peak resident memory in KB, as reported by isolate's `max-rss` field
    /// in its `--meta` output (a real kernel-reported cgroup peak, not an
    /// approximation). `None` if the box failed to start before any run.
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

    run_in_isolate(&shell_command, input_data, time_limit_secs, &[]).await
}

pub async fn run_portugol(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = format!(
        "echo \"{}\" | base64 -d > script.por && java -jar /portugol/portugol-console.jar -no-wait script.por",
        b64_code
    );

    let normalized_input = input_data.split_whitespace().collect::<Vec<_>>().join("\n");
    run_in_isolate(
        &shell_command,
        &normalized_input,
        time_limit_secs,
        &["/portugol"],
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

    run_in_isolate(&shell_command, input_data, time_limit_secs, &[]).await
}

pub async fn run_c(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = compile_and_run_command(
        &format!("echo \"{}\" | base64 -d > solution.c", b64_code),
        "gcc -o program solution.c",
        "./program",
    );

    run_in_isolate(&shell_command, input_data, time_limit_secs, &[]).await
}

pub async fn run_java(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = compile_and_run_command(
        &format!("echo \"{}\" | base64 -d > Main.java", b64_code),
        "javac Main.java",
        "java Main",
    );

    run_in_isolate(&shell_command, input_data, time_limit_secs, &[]).await
}

pub async fn run_rust(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = compile_and_run_command(
        &format!("echo \"{}\" | base64 -d > script.rs", b64_code),
        "rustc script.rs -o program",
        "./program",
    );

    run_in_isolate(&shell_command, input_data, time_limit_secs, &[]).await
}

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
                    meta.exit_code
                        .unwrap_or_else(|| output.status.code().unwrap_or(-1))
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
