use crate::models::Language;
use std::time::{Duration, Instant};
use tokio::time::timeout;

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
pub(crate) const JVM_TOOL_OPTIONS: &str = "-Xmx64m -XX:CompressedClassSpaceSize=32m -XX:ReservedCodeCacheSize=32m -XX:MaxMetaspaceSize=64m -XX:ParallelGCThreads=1 -XX:CICompilerCount=1 -Xss256k -XX:-TieredCompilation";

/// Box memory cap for Rust. Same `RLIMIT_AS`-vs-cgroup story as the JVM
/// languages above, smaller scale: `rustc` (Debian's package) dynamically
/// links `libLLVM-14.so.1`, a ~110MB shared object, plus a ~65MB
/// `librustc_driver` — comfortably fit in real RSS under the old Docker
/// `--memory 128m`, but `RLIMIT_AS` counts the full mmap of both up front
/// regardless of how much of them is ever touched. 512MB was the smallest
/// cap that compiled+ran a trivial program in manual testing; 768MB gave
/// clean, repeatable runs with margin.
const RUST_MEM_KB: u64 = 786_432;

/// CPU budget for a compile step. Compilation runs once per submission in its
/// own box and never counts against the problem's time limit, so this only
/// needs to stop a pathological compile (template/const-eval bombs).
const COMPILE_TIME_SECS: f64 = 30.0;

pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub is_timeout: bool,
    pub is_compile_error: bool,
    pub duration_ms: i64,
    /// Peak resident memory in KB, as reported by isolate's `max-rss` field
    /// in its `--meta` output. Without `--cg` (see `JVM_MEM_KB` above), this
    /// comes from `getrusage`-based max-RSS tracking, not real cgroup memory
    /// accounting. `None` if the box failed to start before any run.
    pub peak_memory_kb: Option<i64>,
    /// The run failed in a way that looks like it ran out of memory (see
    /// `looks_like_memory_limit`). Only ever set on a failed run.
    pub is_memory_limit: bool,
    /// The sandbox itself failed (box init, file staging, reading output) —
    /// a judge-side fault, not the submission's.
    pub is_internal_error: bool,
}

impl ExecutionResult {
    fn internal_error(message: String, started_at: Instant) -> Self {
        ExecutionResult {
            stdout: String::new(),
            stderr: message,
            exit_code: -1,
            is_timeout: false,
            is_compile_error: false,
            duration_ms: started_at.elapsed().as_millis() as i64,
            peak_memory_kb: None,
            is_memory_limit: false,
            is_internal_error: true,
        }
    }
}

/// Error output markers of an allocation failure, per runtime: Python,
/// C++, the JVM, Rust's default alloc error handler, and libc/perror.
const OUT_OF_MEMORY_MARKERS: &[&str] = &[
    "MemoryError",
    "std::bad_alloc",
    "java.lang.OutOfMemoryError",
    "memory allocation of",
    "Cannot allocate memory",
    "out of memory",
];

/// Whether a run that already failed (non-zero exit or signal) most likely
/// died from its memory cap. The box cap is `RLIMIT_AS` (see `JVM_MEM_KB`),
/// so exceeding it never yields a clean isolate status — the program sees a
/// failed allocation and crashes, so this goes by peak RSS near the cap,
/// isolate's own message, or the runtime's out-of-memory error text.
pub fn looks_like_memory_limit(
    stderr: &str,
    isolate_message: Option<&str>,
    peak_memory_kb: Option<i64>,
    mem_kb: u64,
) -> bool {
    let near_cap = peak_memory_kb.is_some_and(|kb| kb as f64 >= mem_kb as f64 * 0.9);
    let isolate_says_memory =
        isolate_message.is_some_and(|m| m.to_ascii_lowercase().contains("memory"));
    near_cap
        || isolate_says_memory
        || OUT_OF_MEMORY_MARKERS
            .iter()
            .any(|marker| stderr.contains(marker))
}

/// A file placed in the box's working directory before a run.
struct BoxFile {
    name: String,
    contents: Vec<u8>,
    executable: bool,
}

/// A submission ready to execute: its source (interpreted languages) or
/// compiled artifacts, plus how to run them. Built once per submission by
/// `prepare`, then reused for every test case by `execute`.
pub struct Prepared {
    files: Vec<BoxFile>,
    run_command: String,
    mem_kb: u64,
    extra_dirs: &'static [&'static str],
    /// Portugol's console runner expects one input token per line.
    normalize_input: bool,
}

struct CompileSpec {
    source_file: &'static str,
    command: String,
    /// Which files in the box are the build output.
    artifacts: Artifacts,
}

enum Artifacts {
    Executable(&'static str),
    /// Every `*.class` file, since nested/inner classes compile separately.
    JavaClasses,
}

/// Per-test CPU limit for `language`, derived from the problem's own
/// `time_limit_ms`: a factor for slower runtimes plus a fixed allowance for
/// runtime startup (JVM boot; Portugol also compiles its generated Java on
/// every run, which can't be split out of the run step).
pub fn time_limit_secs(language: Language, time_limit_ms: i32) -> f64 {
    let base = f64::from(time_limit_ms.max(1)) / 1000.0;
    match language {
        Language::C | Language::Cpp | Language::Rust => base,
        Language::Java => base * 2.0 + 0.5,
        Language::Python => base * 3.0,
        Language::Portugol => base * 2.0 + 3.0,
    }
}

/// Compiles `code` once (compiled languages) or just stages the source
/// (interpreted ones). `Err` carries the failed compile (`is_compile_error`)
/// or an internal sandbox failure, in the same shape a failed run has.
pub async fn prepare(code: &str, language: Language) -> Result<Prepared, ExecutionResult> {
    let source = |name: &str| BoxFile {
        name: name.to_string(),
        contents: code.as_bytes().to_vec(),
        executable: false,
    };

    match language {
        Language::Python => Ok(Prepared {
            files: vec![source("script.py")],
            run_command: "python3 script.py".to_string(),
            mem_kb: DEFAULT_MEM_KB,
            extra_dirs: &[],
            normalize_input: false,
        }),
        // `export JAVA_TOOL_OPTIONS=...` (rather than passing `-XX:...` flags
        // directly to `java`) so the same tuning also reaches the nested
        // `javac` process the Portugol console jar spawns internally to
        // compile the generated Java — see `JVM_MEM_KB`/`JVM_TOOL_OPTIONS`.
        Language::Portugol => Ok(Prepared {
            files: vec![source("script.por")],
            run_command: format!(
                "export JAVA_TOOL_OPTIONS='{}'; java -jar /portugol/portugol-console.jar -no-wait script.por",
                JVM_TOOL_OPTIONS
            ),
            mem_kb: JVM_MEM_KB,
            // `/portugol` for the console jar itself; `/etc/alternatives`
            // because Debian/Temurin's `java`/`javac` under /usr/bin are
            // symlinks through /etc/alternatives, and /etc isn't one of
            // isolate's default-visible directories (only /bin, /lib, /lib64,
            // /usr are) — without this the console jar's own internal `javac`
            // subprocess call fails with "Cannot run program \"javac\"".
            extra_dirs: &["/portugol", "/etc/alternatives"],
            normalize_input: true,
        }),
        Language::C => {
            compile(
                code,
                CompileSpec {
                    source_file: "solution.c",
                    command: "gcc -o program solution.c".to_string(),
                    artifacts: Artifacts::Executable("program"),
                },
                "./program",
                DEFAULT_MEM_KB,
                &[],
            )
            .await
        }
        Language::Cpp => {
            compile(
                code,
                CompileSpec {
                    source_file: "solution.cpp",
                    command: "g++ -o program solution.cpp".to_string(),
                    artifacts: Artifacts::Executable("program"),
                },
                "./program",
                DEFAULT_MEM_KB,
                &[],
            )
            .await
        }
        // rustc's default linker is `cc`, which — like `java`/`javac` — is an
        // /etc/alternatives symlink on Debian, not a plain file under
        // /usr/bin; without it, linking fails with "linker `cc` not found".
        Language::Rust => {
            compile(
                code,
                CompileSpec {
                    source_file: "script.rs",
                    command: "rustc script.rs -o program".to_string(),
                    artifacts: Artifacts::Executable("program"),
                },
                "./program",
                RUST_MEM_KB,
                &["/etc/alternatives"],
            )
            .await
        }
        // Java submissions must define `public class Main`.
        Language::Java => {
            let opts = format!("export JAVA_TOOL_OPTIONS='{}'", JVM_TOOL_OPTIONS);
            compile(
                code,
                CompileSpec {
                    source_file: "Main.java",
                    command: format!("{}; javac Main.java", opts),
                    artifacts: Artifacts::JavaClasses,
                },
                &format!("{}; java Main", opts),
                JVM_MEM_KB,
                &["/etc/alternatives"],
            )
            .await
        }
    }
}

async fn compile(
    code: &str,
    spec: CompileSpec,
    run_command: &str,
    mem_kb: u64,
    extra_dirs: &'static [&'static str],
) -> Result<Prepared, ExecutionResult> {
    let started_at = Instant::now();
    let files = [BoxFile {
        name: spec.source_file.to_string(),
        contents: code.as_bytes().to_vec(),
        executable: false,
    }];
    let limits = crate::isolate::IsolateLimits {
        time_secs: COMPILE_TIME_SECS,
        wall_time_secs: COMPILE_TIME_SECS * 2.0,
        mem_kb,
        processes: 64,
    };

    let (result, artifacts) = in_box(
        &files,
        None,
        &limits,
        extra_dirs,
        &spec.command,
        started_at,
        |box_path| collect_artifacts(box_path, &spec.artifacts),
    )
    .await;

    if result.is_timeout {
        return Err(ExecutionResult {
            is_compile_error: true,
            is_timeout: false,
            stderr: format!("Compilation timed out ({}s)", COMPILE_TIME_SECS),
            ..result
        });
    }
    if result.exit_code != 0 {
        // A sandbox failure isn't the source's fault; anything else is the
        // compiler rejecting it.
        let is_compile_error = !result.is_internal_error;
        return Err(ExecutionResult {
            is_compile_error,
            ..result
        });
    }

    match artifacts {
        Some(files) if !files.is_empty() => Ok(Prepared {
            files,
            run_command: run_command.to_string(),
            mem_kb,
            extra_dirs,
            normalize_input: false,
        }),
        _ => Err(ExecutionResult::internal_error(
            "Internal error: compiler produced no output".to_string(),
            started_at,
        )),
    }
}

async fn collect_artifacts(
    box_path: std::path::PathBuf,
    artifacts: &Artifacts,
) -> Option<Vec<BoxFile>> {
    match artifacts {
        Artifacts::Executable(name) => {
            let contents = tokio::fs::read(box_path.join(name)).await.ok()?;
            Some(vec![BoxFile {
                name: name.to_string(),
                contents,
                executable: true,
            }])
        }
        Artifacts::JavaClasses => {
            let mut files = Vec::new();
            let mut entries = tokio::fs::read_dir(&box_path).await.ok()?;
            while let Ok(Some(entry)) = entries.next_entry().await {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.ends_with(".class") {
                    let contents = tokio::fs::read(entry.path()).await.ok()?;
                    files.push(BoxFile {
                        name,
                        contents,
                        executable: false,
                    });
                }
            }
            Some(files)
        }
    }
}

/// Runs a prepared submission against one test case in a fresh box, with
/// `time_limit_secs` of CPU time (see `time_limit_secs`).
pub async fn execute(
    prepared: &Prepared,
    input_data: &str,
    time_limit_secs: f64,
) -> ExecutionResult {
    let started_at = Instant::now();
    let input = if prepared.normalize_input {
        input_data.split_whitespace().collect::<Vec<_>>().join("\n")
    } else {
        input_data.to_string()
    };
    let limits = crate::isolate::IsolateLimits {
        time_secs: time_limit_secs,
        wall_time_secs: time_limit_secs * 2.0 + 1.0,
        mem_kb: prepared.mem_kb,
        processes: 64, // fork-bomb cap; new, additive safety property vs the Docker version
    };

    let (result, ()) = in_box(
        &prepared.files,
        Some(&input),
        &limits,
        prepared.extra_dirs,
        &prepared.run_command,
        started_at,
        |_| async {},
    )
    .await;
    result
}

/// CPU budget for one custom-checker run. Fixed rather than derived from the
/// problem's limit: the checker is the author's code, not the submission's.
pub const CHECKER_TIME_SECS: f64 = 10.0;

/// Runs a prepared custom checker (`problem.compare_mode = 'checker'`) in a
/// fresh box with `input.txt`, `output.txt` (the submission's stdout) and
/// `answer.txt` (the declared output) staged next to it and passed as
/// arguments in that order, testlib-style. No stdin.
pub async fn execute_checker(
    checker: &Prepared,
    input: &str,
    output: &str,
    answer: &str,
) -> ExecutionResult {
    let started_at = Instant::now();
    let mut files: Vec<BoxFile> = checker
        .files
        .iter()
        .map(|f| BoxFile {
            name: f.name.clone(),
            contents: f.contents.clone(),
            executable: f.executable,
        })
        .collect();
    for (name, contents) in [
        ("input.txt", input),
        ("output.txt", output),
        ("answer.txt", answer),
    ] {
        files.push(BoxFile {
            name: name.to_string(),
            contents: contents.as_bytes().to_vec(),
            executable: false,
        });
    }
    let limits = crate::isolate::IsolateLimits {
        time_secs: CHECKER_TIME_SECS,
        wall_time_secs: CHECKER_TIME_SECS * 2.0 + 1.0,
        mem_kb: checker.mem_kb,
        processes: 64,
    };
    let command = format!("{} input.txt output.txt answer.txt", checker.run_command);

    let (result, ()) = in_box(
        &files,
        None,
        &limits,
        checker.extra_dirs,
        &command,
        started_at,
        |_| async {},
    )
    .await;
    result
}

/// One isolate box lifecycle: init, write `files` (+ stdin), run
/// `/bin/sh -c shell_command` under `limits`, let `after_run` read the box
/// (e.g. compiled artifacts), clean up.
async fn in_box<T, F, Fut>(
    files: &[BoxFile],
    stdin: Option<&str>,
    limits: &crate::isolate::IsolateLimits,
    extra_dirs: &[&str],
    shell_command: &str,
    started_at: Instant,
    after_run: F,
) -> (ExecutionResult, T)
where
    T: Default,
    F: FnOnce(std::path::PathBuf) -> Fut,
    Fut: std::future::Future<Output = T>,
{
    println!("   🔒 Running in isolate sandbox");

    let sandbox_box = match crate::isolate::box_init().await {
        Ok(b) => b,
        Err(e) => {
            eprintln!("Failed to init isolate box: {}", e);
            return (
                ExecutionResult::internal_error(
                    format!("Internal error: failed to start runner ({})", e),
                    started_at,
                ),
                T::default(),
            );
        }
    };

    let stdin_file = "stdin.txt";
    if let Err(e) = write_box_files(&sandbox_box.path, files, stdin.map(|s| (stdin_file, s))).await
    {
        crate::isolate::box_cleanup(sandbox_box.id).await;
        eprintln!("Failed to prepare sandbox files: {}", e);
        return (
            ExecutionResult::internal_error(
                format!("Internal error: failed to prepare runner input ({})", e),
                started_at,
            ),
            T::default(),
        );
    }

    let outer_watchdog = Duration::from_secs_f64(limits.wall_time_secs + 5.0);
    let run_result = timeout(
        outer_watchdog,
        crate::isolate::box_run(
            sandbox_box.id,
            limits,
            stdin.map(|_| stdin_file),
            extra_dirs,
            &["/bin/sh", "-c", shell_command],
        ),
    )
    .await;

    let extra = after_run(sandbox_box.path.clone()).await;
    crate::isolate::box_cleanup(sandbox_box.id).await;

    let result = match run_result {
        Ok(Ok((output, meta))) => {
            let is_timeout = meta.status.as_deref() == Some("TO");
            let stderr = if is_timeout {
                "Time Limit Exceeded".to_string()
            } else {
                String::from_utf8_lossy(&output.stderr).to_string()
            };
            let exit_code = if is_timeout {
                124
            } else {
                meta.exit_code
                    .unwrap_or_else(|| output.status.code().unwrap_or(-1))
            };
            let is_memory_limit = !is_timeout
                && exit_code != 0
                && looks_like_memory_limit(
                    &stderr,
                    meta.message.as_deref(),
                    meta.max_rss_kb,
                    limits.mem_kb,
                );
            ExecutionResult {
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr,
                exit_code,
                is_timeout,
                is_compile_error: false,
                duration_ms: started_at.elapsed().as_millis() as i64,
                peak_memory_kb: meta.max_rss_kb,
                is_memory_limit,
                is_internal_error: false,
            }
        }
        Ok(Err(e)) => {
            eprintln!("Failed to run isolate box: {}", e);
            ExecutionResult::internal_error(
                format!("Internal error: failed to read runner output ({})", e),
                started_at,
            )
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
                is_memory_limit: false,
                is_internal_error: false,
            }
        }
    };

    (result, extra)
}

async fn write_box_files(
    box_path: &std::path::Path,
    files: &[BoxFile],
    stdin: Option<(&str, &str)>,
) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;

    for file in files {
        let path = box_path.join(&file.name);
        tokio::fs::write(&path, &file.contents).await?;
        let mode = if file.executable { 0o755 } else { 0o644 };
        tokio::fs::set_permissions(&path, std::fs::Permissions::from_mode(mode)).await?;
    }
    if let Some((name, contents)) = stdin {
        tokio::fs::write(box_path.join(name), contents).await?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn memory_markers_are_detected() {
        assert!(looks_like_memory_limit(
            "Traceback (most recent call last):\nMemoryError\n",
            None,
            Some(9_000),
            DEFAULT_MEM_KB,
        ));
        assert!(looks_like_memory_limit(
            "terminate called after throwing an instance of 'std::bad_alloc'",
            None,
            None,
            DEFAULT_MEM_KB,
        ));
        assert!(looks_like_memory_limit(
            "Exception in thread \"main\" java.lang.OutOfMemoryError: Java heap space",
            None,
            None,
            JVM_MEM_KB,
        ));
    }

    #[test]
    fn peak_rss_near_cap_counts_as_memory_limit() {
        assert!(looks_like_memory_limit(
            "",
            None,
            Some(125_000),
            DEFAULT_MEM_KB
        ));
        assert!(!looks_like_memory_limit(
            "",
            None,
            Some(20_000),
            DEFAULT_MEM_KB
        ));
    }

    #[test]
    fn ordinary_crash_is_not_memory_limit() {
        assert!(!looks_like_memory_limit(
            "ZeroDivisionError: division by zero",
            Some("Exited with error status 1"),
            Some(9_000),
            DEFAULT_MEM_KB,
        ));
    }
}
