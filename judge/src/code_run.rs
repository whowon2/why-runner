//! "Run with custom input": one ungraded execution of a student's program
//! with their own stdin. Same sandbox, compile step and limits as grading
//! (`runner::prepare` / `runner::execute` / `runner::time_limit_secs`), but no
//! test cases, no comparison and no effect on any score.

use crate::models::{CodeRunStatus, Language};
use crate::runner::{self, ExecutionResult};

/// Most stdout (and, separately, stderr) bytes stored per run.
pub const MAX_RUN_OUTPUT_BYTES: usize = 64 * 1024;

/// What `update_run_result` writes back to the `code_run` row.
#[derive(Debug)]
pub struct RunOutcome {
    pub status: CodeRunStatus,
    pub stdout: String,
    pub stderr: String,
    pub stdout_truncated: bool,
    pub stderr_truncated: bool,
    /// The program's exit code; `None` when it never ran to an exit
    /// (compile error, timeout, sandbox failure).
    pub exit_code: Option<i32>,
    pub runtime_ms: i64,
    pub memory_kb: Option<i64>,
}

impl RunOutcome {
    /// A judge-side failure before the program could run.
    pub fn error(message: String) -> Self {
        RunOutcome {
            status: CodeRunStatus::Error,
            stdout: String::new(),
            stderr: message,
            stdout_truncated: false,
            stderr_truncated: false,
            exit_code: None,
            runtime_ms: 0,
            memory_kb: None,
        }
    }
}

/// Compiles (if needed) and runs `code` once with `stdin`, under the CPU
/// limit a graded submission on a problem with `time_limit_ms` would get.
pub async fn execute(
    code: &str,
    language: Language,
    stdin: &str,
    time_limit_ms: i32,
) -> RunOutcome {
    let result = match runner::prepare(code, language).await {
        Ok(prepared) => {
            let time_limit = runner::time_limit_secs(language, time_limit_ms);
            runner::execute(&prepared, stdin, time_limit).await
        }
        Err(result) => result,
    };
    outcome(result)
}

/// Maps a finished (or failed-to-compile) execution to a run status, with
/// the same rules grading uses for a single test case.
pub fn status_of(result: &ExecutionResult) -> CodeRunStatus {
    if result.is_compile_error {
        CodeRunStatus::CompilationError
    } else if result.is_internal_error {
        CodeRunStatus::Error
    } else if result.is_timeout {
        CodeRunStatus::TimeLimitExceeded
    } else if result.exit_code != 0 {
        if result.is_memory_limit {
            CodeRunStatus::MemoryLimitExceeded
        } else {
            CodeRunStatus::RuntimeError
        }
    } else {
        CodeRunStatus::Ok
    }
}

fn outcome(result: ExecutionResult) -> RunOutcome {
    let status = status_of(&result);
    let exited = matches!(
        status,
        CodeRunStatus::Ok | CodeRunStatus::RuntimeError | CodeRunStatus::MemoryLimitExceeded
    );
    let (stdout, stdout_truncated) = cap_output(result.stdout);
    let (stderr, stderr_truncated) = cap_output(strip_isolate_status(&result.stderr));
    RunOutcome {
        status,
        stdout,
        stderr,
        stdout_truncated,
        stderr_truncated,
        exit_code: exited.then_some(result.exit_code),
        runtime_ms: result.duration_ms,
        memory_kb: result.peak_memory_kb,
    }
}

/// Starts of the one-line summary isolate prints to its own stderr after
/// every run (unless `--silent`). That stderr is the same pipe as the
/// program's, so the summary ends up in it.
const ISOLATE_STATUS_PREFIXES: &[&str] = &[
    "OK (",
    "Time limit exceeded",
    "Exited with error status ",
    "Caught fatal signal ",
    "Out of memory",
];

/// The program's own stderr: drops isolate's trailing summary line, which
/// also covers a program whose last stderr line had no newline (isolate's
/// text is then glued to it). Grading keeps the raw text; only runs show
/// stderr verbatim to students.
pub fn strip_isolate_status(stderr: &str) -> String {
    let trimmed = stderr.trim_end_matches('\n');
    let line_start = trimmed.rfind('\n').map_or(0, |i| i + 1);
    let last_line = &trimmed[line_start..];
    ISOLATE_STATUS_PREFIXES
        .iter()
        .filter_map(|prefix| last_line.rfind(prefix))
        .max()
        .map_or_else(
            || stderr.to_string(),
            |pos| trimmed[..line_start + pos].to_string(),
        )
}

/// Keeps at most `MAX_RUN_OUTPUT_BYTES` (on a char boundary) and says
/// whether anything was cut.
pub fn cap_output(text: String) -> (String, bool) {
    if text.len() <= MAX_RUN_OUTPUT_BYTES {
        return (text, false);
    }
    (
        crate::truncate(&text, MAX_RUN_OUTPUT_BYTES).to_string(),
        true,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn result(exit_code: i32) -> ExecutionResult {
        ExecutionResult {
            stdout: "out".to_string(),
            stderr: "err".to_string(),
            exit_code,
            is_timeout: false,
            is_compile_error: false,
            duration_ms: 12,
            peak_memory_kb: Some(3000),
            is_memory_limit: false,
            is_internal_error: false,
        }
    }

    #[test]
    fn clean_exit_is_ok_with_exit_code() {
        let out = outcome(result(0));
        assert_eq!(out.status, CodeRunStatus::Ok);
        assert_eq!(out.exit_code, Some(0));
        assert_eq!(out.stdout, "out");
        assert_eq!(out.memory_kb, Some(3000));
    }

    #[test]
    fn failures_map_like_grading() {
        assert_eq!(status_of(&result(1)), CodeRunStatus::RuntimeError);

        let mut mle = result(137);
        mle.is_memory_limit = true;
        assert_eq!(status_of(&mle), CodeRunStatus::MemoryLimitExceeded);

        let mut tle = result(137);
        tle.is_timeout = true;
        assert_eq!(status_of(&tle), CodeRunStatus::TimeLimitExceeded);
        assert_eq!(outcome(tle).exit_code, None);

        let mut compile = result(1);
        compile.is_compile_error = true;
        assert_eq!(status_of(&compile), CodeRunStatus::CompilationError);

        let mut internal = result(-1);
        internal.is_internal_error = true;
        assert_eq!(status_of(&internal), CodeRunStatus::Error);
    }

    #[test]
    fn isolate_summary_is_stripped_from_stderr() {
        assert_eq!(
            strip_isolate_status("OK (0.002 sec real, 0.002 sec wall)\n"),
            ""
        );
        assert_eq!(
            strip_isolate_status("Traceback...\nValueError: x\nExited with error status 1\n"),
            "Traceback...\nValueError: x\n"
        );
        // Program stderr without a trailing newline: isolate's text is glued on.
        assert_eq!(
            strip_isolate_status("no newlineExited with error status 2\n"),
            "no newline"
        );
        // Nothing of isolate's: kept as is.
        assert_eq!(strip_isolate_status("just a warning\n"), "just a warning\n");
    }

    #[test]
    fn output_is_capped_on_a_char_boundary() {
        let (short, cut) = cap_output("hi".to_string());
        assert_eq!((short.as_str(), cut), ("hi", false));

        // 'é' is 2 bytes; the leading 'a' puts the cap inside one of them.
        let long = format!("a{}", "é".repeat(MAX_RUN_OUTPUT_BYTES));
        let (capped, cut) = cap_output(long);
        assert!(cut);
        assert_eq!(capped.len(), MAX_RUN_OUTPUT_BYTES - 1);
        assert!(capped.chars().skip(1).all(|c| c == 'é'));
    }
}
