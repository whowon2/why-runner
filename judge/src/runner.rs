use crate::models::Language;
use base64::{Engine as _, engine::general_purpose};
use std::time::{Duration, Instant};
use tokio::time::timeout;

const COMPILE_ERROR_MARKER: &str = "##COMPILE_ERROR##";

/// Default box memory cap: 128MB, matches the previous `docker run --memory
/// 128m`.
const DEFAULT_MEM_KB: u64 = 131_072;

/// Box memory cap for JVM-based languages (Java, Portugol).
///
/// isolate's `--mem` is a `RLIMIT_AS` (virtual address space) cap, not a real
/// (cgroup) RSS cap — real cgroup memory accounting (`isolate --cg`) needs a
/// writable cgroup delegation this container doesn't have. The JVM reserves
/// virtual address space far beyond what it actually uses (~1GB for
/// compressed class space alone, by default) even for a trivial program, so
/// under `RLIMIT_AS` it needs a much larger nominal cap than other languages
/// to even start — real physical usage is still bounded by the `-Xmx`/`-XX:`
/// flags `run_java`/`run_portugol` pass via `JAVA_TOOL_OPTIONS`. Portugol is
/// the tighter case: its console jar spawns its own nested `javac` process
/// (also picking up the same tuned flags via the inherited environment
/// variable) to compile the generated Java, and empirically needed >1GB to
/// stop being flaky; 2GB gave 6/6 clean runs in manual testing with margin.
const JVM_MEM_KB: u64 = 2_097_152;

/// `-XX` flags that shrink the JVM's own virtual-address-space footprint
/// (compressed class space defaults to a 1GB reservation on its own) so it
/// fits under `JVM_MEM_KB`'s `RLIMIT_AS` cap. Passed via `JAVA_TOOL_OPTIONS`
/// rather than as direct `java` args so a nested JVM process (Portugol's
/// internal `javac` call) picks the same flags up too. The JVM prints a
/// "Picked up JAVA_TOOL_OPTIONS: ..." notice to stderr on every run because
/// of this — harmless (grading only checks stdout/exit code), but expected
/// in stderr for Java/Portugol runs.
const JVM_TOOL_OPTIONS: &str = "-Xmx64m -XX:CompressedClassSpaceSize=32m -XX:ReservedCodeCacheSize=32m -XX:MaxMetaspaceSize=64m -XX:ParallelGCThreads=1 -XX:CICompilerCount=1 -Xss256k -XX:-TieredCompilation";

/// Box memory cap for Rust. Same `RLIMIT_AS`-vs-cgroup story as the JVM
/// languages above, smaller scale: `rustc` (Debian's package) dynamically
/// links `libLLVM-14.so.1`, a ~110MB shared object, plus a ~65MB
/// `librustc_driver` — comfortably fit in real RSS under the old Docker
/// `--memory 128m`, but `RLIMIT_AS` counts the full mmap of both up front
/// regardless of how much of them is ever touched. 512MB was the smallest
/// cap that compiled+ran a trivial program in manual testing; 768MB gave
/// clean, repeatable runs with margin.
const RUST_MEM_KB: u64 = 786_432;

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

    run_in_isolate(
        &shell_command,
        input_data,
        time_limit_secs,
        DEFAULT_MEM_KB,
        &[],
    )
    .await
}

pub async fn run_portugol(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    // `export JAVA_TOOL_OPTIONS=...` (rather than passing `-XX:...` flags
    // directly to `java`) so the same tuning also reaches the nested `javac`
    // process the Portugol console jar spawns internally to compile the
    // generated Java — see `JVM_MEM_KB`/`JVM_TOOL_OPTIONS` above.
    let shell_command = format!(
        "export JAVA_TOOL_OPTIONS='{opts}'; echo \"{code}\" | base64 -d > script.por && java -jar /portugol/portugol-console.jar -no-wait script.por",
        opts = JVM_TOOL_OPTIONS,
        code = b64_code
    );

    let normalized_input = input_data.split_whitespace().collect::<Vec<_>>().join("\n");
    run_in_isolate(
        &shell_command,
        &normalized_input,
        time_limit_secs,
        JVM_MEM_KB,
        // `/portugol` for the console jar itself; `/etc/alternatives` because
        // Debian/Temurin's `java`/`javac` under /usr/bin are symlinks through
        // /etc/alternatives, and /etc isn't one of isolate's default-visible
        // directories (only /bin, /lib, /lib64, /usr are) — without this the
        // console jar's own internal `javac` subprocess call fails with
        // "Cannot run program \"javac\"".
        &["/portugol", "/etc/alternatives"],
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

    run_in_isolate(
        &shell_command,
        input_data,
        time_limit_secs,
        DEFAULT_MEM_KB,
        &[],
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

    run_in_isolate(
        &shell_command,
        input_data,
        time_limit_secs,
        DEFAULT_MEM_KB,
        &[],
    )
    .await
}

pub async fn run_java(code: &str, input_data: &str, time_limit_secs: u64) -> ExecutionResult {
    let b64_code = general_purpose::STANDARD.encode(code);
    let shell_command = compile_and_run_command(
        &format!(
            "export JAVA_TOOL_OPTIONS='{opts}'; echo \"{code}\" | base64 -d > Main.java",
            opts = JVM_TOOL_OPTIONS,
            code = b64_code
        ),
        "javac Main.java",
        "java Main",
    );

    run_in_isolate(
        &shell_command,
        input_data,
        time_limit_secs,
        JVM_MEM_KB,
        // See `run_portugol` above: /usr/bin/java(c) are symlinks through
        // /etc/alternatives, which isn't one of isolate's default-visible
        // directories.
        &["/etc/alternatives"],
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

    run_in_isolate(
        &shell_command,
        input_data,
        time_limit_secs,
        RUST_MEM_KB,
        // rustc's default linker is `cc`, which — like `java`/`javac` above —
        // is an /etc/alternatives symlink on Debian, not a plain file under
        // /usr/bin; without this, linking fails with "linker `cc` not found".
        &["/etc/alternatives"],
    )
    .await
}

async fn run_in_isolate(
    shell_command: &str,
    input_data: &str,
    time_limit_secs: u64,
    mem_kb: u64,
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
        mem_kb,
        processes: 64, // fork-bomb cap; new, additive safety property vs the Docker version
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
