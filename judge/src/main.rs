#[cfg(test)]
mod bench;
mod code_run;
mod compare;
mod constraints;
mod db;
mod isolate;
mod models;
mod runner;

use sqlx::postgres::PgListener;
use std::env;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use tokio::sync::Notify;
use tokio::time::{Duration, Instant, timeout};

use crate::{
    db::DbClient,
    models::{
        CodeRun, CompareMode, ConstraintKind, JudgeReport, Language, Problem, ProblemConstraint,
        ProblemValidation, Submission, SubmissionStatus, TestCaseResult,
    },
};

/// DB may not be ready to accept connections yet on cold start (e.g. Postgres
/// container still initializing). Retry with a capped backoff instead of
/// failing on the first attempt.
const DB_CONNECT_MAX_ATTEMPTS: u32 = 15;
const DB_CONNECT_BACKOFF_CAP: Duration = Duration::from_secs(5);

async fn connect_with_retry<T, F, Fut>(what: &str, connect: F) -> T
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = sqlx::Result<T>>,
{
    let mut attempt = 0u32;
    loop {
        attempt += 1;
        match connect().await {
            Ok(value) => return value,
            Err(err) if attempt < DB_CONNECT_MAX_ATTEMPTS => {
                let backoff = Duration::from_secs(attempt as u64).min(DB_CONNECT_BACKOFF_CAP);
                println!(
                    "{} connection attempt {}/{} failed: {}. Retrying in {:?}...",
                    what, attempt, DB_CONNECT_MAX_ATTEMPTS, err, backoff
                );
                tokio::time::sleep(backoff).await;
            }
            Err(err) => panic!(
                "{} failed to connect after {} attempts: {}",
                what, DB_CONNECT_MAX_ATTEMPTS, err
            ),
        }
    }
}

/// Default worker count when `JUDGE_CONCURRENCY` is unset: one per CPU, but
/// at most this many. Concurrent jobs share the VM's memory (2GB on Fly.io,
/// where one rustc compile or JVM run alone can take hundreds of MB) and the
/// box_root tmpfs, and oversubscribed CPUs stretch wall time towards
/// isolate's `--wall-time` limit.
const DEFAULT_MAX_CONCURRENCY: usize = 4;

/// Periodic sweep in case a notify was missed.
const SWEEP_INTERVAL: Duration = Duration::from_secs(60);

/// Worker count from `JUDGE_CONCURRENCY`, falling back to the CPU-based
/// default when unset or not a positive integer. Never more than the box ids
/// reserved for workers (`isolate::MAX_WORKERS`).
fn parse_concurrency(value: Option<&str>, cpus: usize) -> usize {
    value
        .and_then(|v| v.trim().parse::<usize>().ok())
        .filter(|&n| n > 0)
        .unwrap_or_else(|| cpus.min(DEFAULT_MAX_CONCURRENCY))
        .clamp(1, isolate::MAX_WORKERS as usize)
}

/// Shared between the dispatcher (main) and the pool workers.
struct PoolState {
    /// Dispatcher → idle workers: new notification, periodic sweep, or stop.
    wake: Notify,
    /// Workers currently claiming or processing a job.
    active: AtomicUsize,
    /// When a worker last finished a job (idle auto-stop).
    last_activity: Mutex<Instant>,
    /// Set once by the idle auto-stop: workers finish their current job and
    /// stop claiming new ones.
    stopping: AtomicBool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    // Which build is running: version from Cargo.toml, commit from the
    // Dockerfile's GIT_SHA build arg ("dev" for local cargo builds).
    println!(
        "WhyRunner judge v{} ({})",
        env!("CARGO_PKG_VERSION"),
        option_env!("GIT_SHA").unwrap_or("dev")
    );

    let concurrency = parse_concurrency(
        env::var("JUDGE_CONCURRENCY").ok().as_deref(),
        std::thread::available_parallelism().map_or(1, |n| n.get()),
    );

    // DB: one connection per worker plus the dispatcher's reaper.
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    println!("Connecting to database...");
    let max_connections = (concurrency as u32 + 2).max(10);
    let db = Arc::new(
        connect_with_retry("Database", || DbClient::new(&database_url, max_connections)).await,
    );
    println!("Database connected");

    // PgListener
    let mut listener =
        connect_with_retry("PgListener", || PgListener::connect(&database_url)).await;
    listener.listen("new_submission").await?;
    listener.listen("new_validation").await?;
    listener.listen("new_run").await?;
    println!("Listening for 'new_submission', 'new_validation' and 'new_run' notifications...");

    // Optional idle auto-stop for on-demand hosts (e.g. a Fly Machine): exit
    // cleanly after this many seconds with no jobs, so the platform leaves the
    // machine stopped instead of billing it. Web restarts it via the Fly
    // Machines API on each new job (web/lib/judge.ts). Unset = run forever.
    let idle_exit_after = env::var("JUDGE_IDLE_EXIT_SECS")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
        .filter(|&secs| secs > 0)
        .map(Duration::from_secs);
    if let Some(after) = idle_exit_after {
        println!(
            "Idle auto-stop enabled: exiting after {:?} without jobs",
            after
        );
    }

    let state = Arc::new(PoolState {
        wake: Notify::new(),
        active: AtomicUsize::new(0),
        last_activity: Mutex::new(Instant::now()),
        stopping: AtomicBool::new(false),
    });

    // Reap before the workers' first drain, so exhausted rows are
    // dead-lettered rather than left for the claim query to skip.
    reap_exhausted(&db).await;
    sweep_runs(&db).await;

    println!("Starting {} judge worker(s)", concurrency);
    let workers: Vec<_> = (0..concurrency as u32)
        .map(|slot| tokio::spawn(worker(slot, db.clone(), state.clone())))
        .collect();

    loop {
        // Wait for a notification OR a periodic sweep, then wake every idle
        // worker to drain. Busy workers drain again on their own once their
        // current job finishes.
        match timeout(SWEEP_INTERVAL, listener.recv()).await {
            Ok(Ok(notification)) => {
                println!(
                    "Woke up! Received notification on channel: {}",
                    notification.channel()
                );
            }
            Ok(Err(e)) => {
                eprintln!("Listener error: {}", e);
                tokio::time::sleep(Duration::from_secs(5)).await;
            }
            Err(_) => {
                println!("Periodic sweep ({:?} timeout reached)", SWEEP_INTERVAL);
            }
        }

        // Dead-letter submissions abandoned by a crashed/killed worker that
        // already exhausted their retry budget, so they aren't reclaimed.
        reap_exhausted(&db).await;
        sweep_runs(&db).await;

        if let Some(after) = idle_exit_after {
            // Workers drain only after the wake below, so a job that arrived
            // with this very notification isn't reflected in `active` or
            // `last_activity` yet: ask the DB too. A failed check counts as
            // "not idle" and is retried on the next wake.
            let idle = state.active.load(Ordering::SeqCst) == 0
                && state.last_activity.lock().unwrap().elapsed() >= after
                && matches!(db.has_claimable_jobs().await, Ok(false));
            if idle {
                println!(
                    "Idle for {:?} with no jobs, exiting (idle auto-stop)",
                    after
                );
                // A worker may have started a claim right after the check
                // above; joining lets it finish and save that job instead of
                // leaving the row RUNNING until the stale reclaim.
                state.stopping.store(true, Ordering::SeqCst);
                state.wake.notify_waiters();
                for handle in workers {
                    let _ = handle.await;
                }
                return Ok(());
            }
        }

        state.wake.notify_waiters();
    }
}

async fn reap_exhausted(db: &DbClient) {
    match db.reap_exhausted_submissions().await {
        Ok(n) if n > 0 => println!("Dead-lettered {} exhausted submission(s)", n),
        Ok(_) => {}
        Err(e) => eprintln!("Failed to reap exhausted submissions: {}", e),
    }
}

/// Fails runs abandoned mid-run and deletes expired ones.
async fn sweep_runs(db: &DbClient) {
    match db.reap_stale_runs().await {
        Ok(n) if n > 0 => println!("Failed {} stale run(s)", n),
        Ok(_) => {}
        Err(e) => eprintln!("Failed to reap stale runs: {}", e),
    }
    match db.prune_old_runs().await {
        Ok(n) if n > 0 => println!("Deleted {} old run(s)", n),
        Ok(_) => {}
        Err(e) => eprintln!("Failed to prune old runs: {}", e),
    }
}

/// One pool worker: drains every claimable job, then sleeps until the
/// dispatcher wakes it. `slot` is also its isolate box id (see
/// `isolate::WORKER_SLOT`).
async fn worker(slot: u32, db: Arc<DbClient>, state: Arc<PoolState>) {
    loop {
        // Register for the next wake-up before draining, so a notify that
        // lands between the last empty claim and the await below isn't lost.
        let notified = state.wake.notified();
        tokio::pin!(notified);
        notified.as_mut().enable();

        while claim_and_process(slot, &db, &state).await {}

        if state.stopping.load(Ordering::SeqCst) {
            return;
        }
        notified.await;
    }
}

/// Claims and runs one job. Returns false when there was nothing to claim or
/// the pool is stopping.
async fn claim_and_process(slot: u32, db: &DbClient, state: &PoolState) -> bool {
    // Counted as active from before the claim, so the idle auto-stop never
    // sees a claimed-but-unfinished job as idle.
    state.active.fetch_add(1, Ordering::SeqCst);
    let worked = !state.stopping.load(Ordering::SeqCst)
        && isolate::WORKER_SLOT
            .scope(slot, run_next_job(slot, db))
            .await;
    if worked {
        *state.last_activity.lock().unwrap() = Instant::now();
    }
    state.active.fetch_sub(1, Ordering::SeqCst);
    worked
}

/// Pending (or crashed-worker-abandoned) submissions first, then pending
/// custom runs (a student is waiting on screen), then pending problem
/// validation runs.
async fn run_next_job(slot: u32, db: &DbClient) -> bool {
    match db.get_next_submission().await {
        Ok(Some(sub)) => {
            if sub.retry_count > 0 {
                println!(
                    "[w{}] Processing submission: {} (retry {}/{})",
                    slot,
                    sub.id,
                    sub.retry_count,
                    db::MAX_RETRIES
                );
            } else {
                println!("[w{}] Processing submission: {}", slot, sub.id);
            }
            process_job(db, sub).await;
            return true;
        }
        Ok(None) => {}
        Err(e) => eprintln!("[w{}] Failed to fetch next submission: {}", slot, e),
    }

    match db.get_next_run().await {
        Ok(Some(run)) => {
            println!("[w{}] Processing run: {}", slot, run.id);
            process_run_job(db, run).await;
            return true;
        }
        Ok(None) => {}
        Err(e) => eprintln!("[w{}] Failed to fetch next run: {}", slot, e),
    }

    match db.get_next_validation().await {
        Ok(Some(validation)) => {
            println!("[w{}] Processing validation: {}", slot, validation.id);
            process_validation_job(db, validation).await;
            true
        }
        Ok(None) => false,
        Err(e) => {
            eprintln!("[w{}] Failed to fetch next validation: {}", slot, e);
            false
        }
    }
}

async fn process_job(db: &DbClient, sub: Submission) {
    let problem = match db.get_problem(sub.problem_id).await {
        Ok(problem) => problem,
        Err(err) => {
            eprintln!("Failed to fetch problem: {}", err);
            return;
        }
    };

    // Solution constraints are an exercise-only feature: never checked for
    // contest submissions or standalone/practice submissions, only when this
    // submission was made against a lesson's exercise. Skip the fetch
    // entirely otherwise, matching the pre-constraints code path exactly.
    let exercise_constraints = match sub.exercise_id {
        Some(exercise_id) => match db.get_exercise_constraints(exercise_id).await {
            Ok(constraints) => constraints,
            Err(err) => {
                eprintln!("Failed to fetch exercise constraints: {}", err);
                return;
            }
        },
        None => Vec::new(),
    };

    println!(
        "\tJudging Submission {} (Language: {:?})",
        sub.id, sub.language
    );

    // Lesson exercises run every declared test case instead of stopping at
    // the first failure, so `passed_count`/`total_tests` reflect true
    // correctness for per-exercise grading (see lesson-per-exercise-grading).
    // Contests and standalone/practice submissions (`exercise_id: None`)
    // keep the original stop-at-first-failure behavior.
    let run_all = sub.exercise_id.is_some();
    let (mut report, runtime_ms, memory_kb) =
        grade(&sub.code, sub.language, &problem, run_all).await;
    let (status, violation_detail) =
        resolve_constraint_status(&sub.code, sub.language, &mut report, &exercise_constraints);

    let output_json = serde_json::to_string(&report).unwrap_or_default();

    if let Err(e) = db
        .update_submission_result(
            &sub,
            status,
            &output_json,
            runtime_ms,
            memory_kb,
            violation_detail.as_deref(),
        )
        .await
    {
        eprintln!("❌ Failed to update DB: {}", e);
    } else {
        println!("\t💾 Result Saved.");
    }
}

async fn process_validation_job(db: &DbClient, validation: ProblemValidation) {
    let problem = match db.get_problem(validation.problem_id).await {
        Ok(problem) => problem,
        Err(err) => {
            eprintln!("Failed to fetch problem: {}", err);
            return;
        }
    };

    println!(
        "\tValidating Problem {} (Language: {:?})",
        validation.problem_id, validation.language
    );

    // Reference-solution validation isn't tied to any specific exercise —
    // always stop at the first failure, same as contest/standalone grading.
    let (report, runtime_ms, _memory_kb) =
        grade(&validation.code, validation.language, &problem, false).await;

    let output_json = serde_json::to_string(&report).unwrap_or_default();
    let status = if report.passed {
        SubmissionStatus::PASSED
    } else {
        SubmissionStatus::FAILED
    };

    if let Err(e) = db
        .update_validation_result(validation.id, status, &output_json, runtime_ms)
        .await
    {
        eprintln!("❌ Failed to update DB: {}", e);
    } else {
        println!("\t💾 Validation result saved.");
    }
}

/// Ungraded "run with custom input": one execution, no tests, no verdict.
async fn process_run_job(db: &DbClient, run: CodeRun) {
    let outcome = match db.get_problem_time_limit(run.problem_id).await {
        Ok(time_limit_ms) => {
            code_run::execute(&run.code, run.language, &run.stdin, time_limit_ms).await
        }
        Err(err) => {
            eprintln!("Failed to fetch problem time limit: {}", err);
            code_run::RunOutcome::error("The judge could not load this problem.".to_string())
        }
    };
    println!("\t▶️ Run finished: {:?}", outcome.status);

    if let Err(e) = db.update_run_result(run.id, &outcome).await {
        eprintln!("❌ Failed to update DB: {}", e);
    }
}

/// Post-I/O-pass constraint check (tasks 3.2-3.4, 4.1). Only runs structural
/// analysis when I/O grading already passed — no point classifying/analyzing
/// code that got the wrong answer. On structural violation,
/// `PENDING_CONSTRAINT_CLASSIFICATION`/algorithm-requirement classification
/// is skipped entirely (spec: "skipping any algorithm-requirement
/// classification step"). Reference-solution validation runs
/// (`process_validation_job`) deliberately do NOT go through this — solution
/// constraints are an exercise feature, and a validation run isn't tied to
/// any specific exercise.
fn resolve_constraint_status(
    code: &str,
    language: Language,
    report: &mut JudgeReport,
    exercise_constraints: &[ProblemConstraint],
) -> (SubmissionStatus, Option<String>) {
    if !report.passed {
        return (report.verdict, None);
    }

    if exercise_constraints.is_empty() {
        return (SubmissionStatus::PASSED, None);
    }

    if let Some(violation) = constraints::check(code, language, exercise_constraints) {
        let detail = format!("{}: {}", violation.rule, violation.message);
        report.constraint_violation = Some(violation);
        return (SubmissionStatus::CONSTRAINT_VIOLATION, Some(detail));
    }

    let has_algorithm_requirement = exercise_constraints
        .iter()
        .any(|c| c.kind == ConstraintKind::AlgorithmRequirement);

    if has_algorithm_requirement {
        (SubmissionStatus::PENDING_CONSTRAINT_CLASSIFICATION, None)
    } else {
        (SubmissionStatus::PASSED, None)
    }
}

/// Shared grading core: runs `code` against every declared input/output pair
/// of `problem`. When `run_all` is false (contests, standalone/practice,
/// pre-publish validation), stops at the first failing test case. When
/// `run_all` is true (lesson exercises), keeps running every remaining test
/// case after a failure so `passed_count` reflects true correctness — only a
/// compile error (or a broken checker) still stops immediately either way,
/// since it applies identically to every test case. `failure_details` and
/// `verdict` always describe just the first failure encountered, matching
/// `JudgeReport`'s single-`Option<TestCaseResult>` shape.
async fn grade(
    code: &str,
    language: Language,
    problem: &Problem,
    run_all: bool,
) -> (JudgeReport, i64, Option<i64>) {
    let total_tests = problem.inputs.len();
    let mut passed_count = 0;
    let mut failure: Option<(SubmissionStatus, TestCaseResult)> = None;
    let mut all_passed = true;
    let mut runtime_ms: i64 = 0;
    let mut memory_kb: Option<i64> = None;

    let time_limit = runner::time_limit_secs(language, problem.time_limit_ms);

    // A failure before any test ran (compile error, sandbox failure, broken
    // checker) is reported against test 1 in the same shape a failed run
    // has, since it applies to every test.
    let early_failure = |verdict: SubmissionStatus, error: String| JudgeReport {
        passed: false,
        verdict,
        total_tests,
        passed_count: 0,
        failure_details: Some(TestCaseResult {
            index: 1,
            input: problem.inputs[0].clone(),
            expected: problem.outputs.first().cloned().unwrap_or_default(),
            actual: String::new(),
            error: Some(error),
        }),
        constraint_violation: None,
    };

    // Compile once per submission, in its own box, outside the per-test time
    // limit.
    let prepared = if total_tests > 0 {
        match runner::prepare(code, language).await {
            Ok(prepared) => Some(prepared),
            Err(result) => {
                runtime_ms += result.duration_ms;
                let report = if result.is_compile_error {
                    println!("\t🛠️ Compile Error");
                    early_failure(
                        SubmissionStatus::COMPILATION_ERROR,
                        format!("Compilation Error:\n{}", result.stderr),
                    )
                } else {
                    early_failure(SubmissionStatus::ERROR, result.stderr)
                };
                return (report, runtime_ms, memory_kb);
            }
        }
    } else {
        None
    };

    let checker = if total_tests > 0 && problem.compare_mode == CompareMode::Checker {
        match prepare_checker(problem).await {
            Ok(checker) => Some(checker),
            Err(error) => {
                println!("\t🧰 Checker unavailable");
                return (
                    early_failure(SubmissionStatus::ERROR, error),
                    runtime_ms,
                    memory_kb,
                );
            }
        }
    } else {
        None
    };

    for (i, input) in problem.inputs.iter().enumerate() {
        let expected = match problem.outputs.get(i) {
            Some(o) => o,
            None => {
                eprintln!("Missing expected output for test case {}", i + 1);
                all_passed = false;
                break;
            }
        };
        let Some(prepared) = prepared.as_ref() else {
            break;
        };

        let result = runner::execute(prepared, input, time_limit).await;
        runtime_ms += result.duration_ms;
        if let Some(kb) = result.peak_memory_kb {
            memory_kb = Some(memory_kb.map_or(kb, |current| current.max(kb)));
        }

        let Some((verdict, actual, error)) = judge_test_case(
            &result,
            input,
            expected,
            problem,
            checker.as_ref(),
            time_limit,
        )
        .await
        else {
            passed_count += 1;
            continue;
        };

        all_passed = false;
        println!("\t❌ {:?} on Test {}", verdict, i + 1);
        if failure.is_none() {
            failure = Some((
                verdict,
                TestCaseResult {
                    index: i + 1,
                    input: input.clone(),
                    expected: expected.clone(),
                    actual,
                    error,
                },
            ));
        }
        if !run_all {
            break;
        }
    }

    let (verdict, failure_details) = match failure {
        Some((verdict, details)) => (verdict, Some(details)),
        // Only reachable with a missing expected output: a malformed
        // problem, not the submission's fault.
        None if !all_passed => (SubmissionStatus::ERROR, None),
        None => (SubmissionStatus::PASSED, None),
    };

    let report = JudgeReport {
        passed: all_passed,
        verdict,
        total_tests,
        passed_count,
        failure_details,
        constraint_violation: None,
    };

    (report, runtime_ms, memory_kb)
}

/// The verdict of one executed test case: `None` when it passed, otherwise
/// the verdict plus the `actual`/`error` shown in the report.
async fn judge_test_case(
    result: &runner::ExecutionResult,
    input: &str,
    expected: &str,
    problem: &Problem,
    checker: Option<&runner::Prepared>,
    time_limit: f64,
) -> Option<(SubmissionStatus, String, Option<String>)> {
    let actual = result.stdout.trim().to_string();

    if result.is_internal_error {
        return Some((SubmissionStatus::ERROR, actual, Some(result.stderr.clone())));
    }
    if result.is_timeout {
        return Some((
            SubmissionStatus::TIME_LIMIT_EXCEEDED,
            "Execution timed out".to_string(),
            Some(format!("Time Limit Exceeded ({}s)", time_limit)),
        ));
    }
    if result.exit_code != 0 {
        // Partial output is kept; stderr carries the traceback.
        let verdict = if result.is_memory_limit {
            SubmissionStatus::MEMORY_LIMIT_EXCEEDED
        } else {
            SubmissionStatus::RUNTIME_ERROR
        };
        return Some((verdict, actual, Some(result.stderr.clone())));
    }

    let Some(checker) = checker else {
        let accepted = compare::matches(
            problem.compare_mode,
            problem.float_epsilon,
            &actual,
            expected,
        );
        return (!accepted).then_some((SubmissionStatus::WRONG_ANSWER, actual, None));
    };

    let verdict = runner::execute_checker(checker, input, &result.stdout, expected).await;
    match verdict.exit_code {
        _ if verdict.is_timeout || verdict.is_internal_error => Some((
            SubmissionStatus::ERROR,
            actual,
            Some(format!("Checker failed: {}", verdict.stderr.trim())),
        )),
        0 => None,
        1 => {
            let message = truncate(verdict.stdout.trim(), CHECKER_MESSAGE_MAX_BYTES);
            Some((
                SubmissionStatus::WRONG_ANSWER,
                actual,
                (!message.is_empty()).then(|| format!("Checker: {}", message)),
            ))
        }
        code => Some((
            SubmissionStatus::ERROR,
            actual,
            Some(format!(
                "Checker failed (exit code {}): {}",
                code,
                verdict.stderr.trim()
            )),
        )),
    }
}

/// Longest checker stdout kept as a wrong-answer message.
const CHECKER_MESSAGE_MAX_BYTES: usize = 1024;

fn truncate(text: &str, max_bytes: usize) -> &str {
    if text.len() <= max_bytes {
        return text;
    }
    let mut end = max_bytes;
    while !text.is_char_boundary(end) {
        end -= 1;
    }
    &text[..end]
}

/// Compiles the problem's custom checker once per graded submission. `Err`
/// is a judge-side fault (missing/unsupported/uncompilable checker), shown to
/// the author through validation runs.
async fn prepare_checker(problem: &Problem) -> Result<runner::Prepared, String> {
    let (Some(language), Some(code)) = (problem.checker_language, problem.checker_code.as_deref())
    else {
        return Err("Checker failed: the problem has no checker configured".to_string());
    };
    if language == Language::Portugol {
        return Err("Checker failed: Portugol checkers are not supported".to_string());
    }
    runner::prepare(code, language)
        .await
        .map_err(|result| format!("Checker failed to compile:\n{}", result.stderr))
}

#[cfg(test)]
mod pool_tests {
    use super::*;

    #[test]
    fn explicit_concurrency_wins_over_cpu_count() {
        assert_eq!(parse_concurrency(Some("3"), 1), 3);
        assert_eq!(parse_concurrency(Some(" 8 "), 2), 8);
    }

    #[test]
    fn default_is_cpu_count_capped() {
        assert_eq!(parse_concurrency(None, 1), 1);
        assert_eq!(parse_concurrency(None, 2), 2);
        assert_eq!(parse_concurrency(None, 32), DEFAULT_MAX_CONCURRENCY);
    }

    #[test]
    fn invalid_values_fall_back_to_default() {
        for bad in ["", "0", "-2", "abc", "1.5"] {
            assert_eq!(parse_concurrency(Some(bad), 2), 2, "value {bad:?}");
        }
    }

    #[test]
    fn never_exceeds_reserved_worker_box_ids() {
        assert_eq!(
            parse_concurrency(Some("5000"), 1),
            isolate::MAX_WORKERS as usize
        );
    }
}

#[cfg(test)]
mod grade_tests {
    use super::*;

    // A tiny Python script that reads one int per line and echoes it back —
    // correct for `expected == input`, wrong otherwise. Cheap and fast to
    // run through the real Python sandbox (needs `isolate` running locally
    // with elevated capabilities, same as production).
    const ECHO_CODE: &str = "print(input())";

    fn problem(inputs: &[&str], outputs: &[&str]) -> Problem {
        Problem {
            inputs: inputs.iter().map(|s| s.to_string()).collect(),
            outputs: outputs.iter().map(|s| s.to_string()).collect(),
            time_limit_ms: 1000,
            compare_mode: CompareMode::Exact,
            float_epsilon: 1e-6,
            checker_language: None,
            checker_code: None,
        }
    }

    fn with_checker(mut p: Problem, language: Language, code: &str) -> Problem {
        p.compare_mode = CompareMode::Checker;
        p.checker_language = Some(language);
        p.checker_code = Some(code.to_string());
        p
    }

    // Burns ~2s of CPU, then echoes its input. Used to check the problem's
    // own time limit is what the judge enforces.
    const BUSY_2S_C: &str = "#include <stdio.h>\n#include <time.h>\nint main(){clock_t s=clock();while((double)(clock()-s)/CLOCKS_PER_SEC<2.0){}int x;scanf(\"%d\",&x);printf(\"%d\\n\",x);return 0;}";

    #[tokio::test]
    async fn problem_time_limit_is_enforced() {
        let p = problem(&["1"], &["1"]); // 1000ms → 1s for C
        let (report, _, _) = grade(BUSY_2S_C, Language::C, &p, false).await;
        assert!(!report.passed);
        assert_eq!(report.verdict, SubmissionStatus::TIME_LIMIT_EXCEEDED);
        let details = report.failure_details.unwrap();
        assert_eq!(details.actual, "Execution timed out");
        assert!(details.error.unwrap_or_default().contains("(1s)"));
    }

    #[tokio::test]
    async fn generous_time_limit_lets_slow_solution_pass() {
        let mut p = problem(&["1"], &["1"]);
        p.time_limit_ms = 5000;
        let (report, _, _) = grade(BUSY_2S_C, Language::C, &p, false).await;
        assert!(
            report.passed,
            "2s of CPU should fit a 5s limit, got: {:?}",
            report.failure_details
        );
    }

    #[tokio::test]
    async fn compiled_once_runs_every_test_case() {
        // The artifact from the single compile step must be reusable across
        // fresh boxes, one per test.
        let code = "#include <stdio.h>\nint main(){int x;scanf(\"%d\",&x);printf(\"%d\\n\",x*2);return 0;}";
        let p = problem(&["1", "2", "3"], &["2", "4", "6"]);
        let (report, _, _) = grade(code, Language::C, &p, false).await;
        assert!(report.passed, "got: {:?}", report.failure_details);
        assert_eq!(report.passed_count, 3);
    }

    #[tokio::test]
    async fn java_inner_classes_survive_the_compile_step() {
        let code = "public class Main{static class Twice{int f(int x){return 2*x;}}public static void main(String[] a){java.util.Scanner sc=new java.util.Scanner(System.in);System.out.println(new Twice().f(sc.nextInt()));}}";
        let p = problem(&["4", "5"], &["8", "10"]);
        let (report, _, _) = grade(code, Language::Java, &p, false).await;
        assert!(report.passed, "got: {:?}", report.failure_details);
    }

    #[tokio::test]
    async fn compile_error_keeps_compiler_output() {
        let p = problem(&["1"], &["1"]);
        let (report, _, _) = grade("int main( {", Language::C, &p, false).await;
        assert_eq!(report.verdict, SubmissionStatus::COMPILATION_ERROR);
        let details = report.failure_details.unwrap();
        let error = details.error.unwrap_or_default();
        assert!(error.starts_with("Compilation Error:"), "got: {error}");
        assert!(error.contains("solution.c"), "got: {error}");
        assert_eq!(details.index, 1);
    }

    #[tokio::test]
    async fn run_all_keeps_going_past_a_mid_suite_failure() {
        // Test 2 is wrong (expects "wrong", echo prints the input back), so
        // a stop-at-first-failure grade would never see tests 3+.
        let p = problem(&["1", "2", "3"], &["1", "wrong", "3"]);
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, true).await;

        assert!(!report.passed);
        assert_eq!(report.verdict, SubmissionStatus::WRONG_ANSWER);
        assert_eq!(report.total_tests, 3);
        assert_eq!(
            report.passed_count, 2,
            "should count tests 1 and 3 as passed despite the failure at test 2"
        );
        assert_eq!(
            report.failure_details.unwrap().index,
            2,
            "failure_details should still capture only the first failure"
        );
    }

    #[tokio::test]
    async fn stop_at_first_failure_when_run_all_is_false() {
        let p = problem(&["1", "2", "3"], &["1", "wrong", "3"]);
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, false).await;

        assert!(!report.passed);
        assert_eq!(report.total_tests, 3);
        assert_eq!(
            report.passed_count, 1,
            "should stop after test 2 and never run test 3"
        );
    }

    #[tokio::test]
    async fn compile_error_stops_immediately_regardless_of_run_all() {
        // Python has no compile step (see `runner::prepare`), so this needs a
        // compiled language to actually exercise `is_compile_error`.
        let p = problem(&["1", "2"], &["1", "2"]);
        let bad_code = "int main( { return 0; }"; // malformed C, won't compile

        for run_all in [false, true] {
            let (report, _, _) = grade(bad_code, Language::C, &p, run_all).await;
            assert!(!report.passed);
            assert_eq!(
                report.passed_count, 0,
                "compile error should short-circuit before any test case passes, run_all={run_all}"
            );
            assert!(report.failure_details.is_some());
        }
    }

    #[tokio::test]
    async fn every_language_can_pass_a_trivial_echo() {
        let cases: &[(Language, &str)] = &[
            (Language::Python, "print(input())"),
            (
                Language::C,
                "#include <stdio.h>\nint main(){int x;scanf(\"%d\",&x);printf(\"%d\\n\",x);return 0;}",
            ),
            (
                Language::Cpp,
                "#include <iostream>\nint main(){int x;std::cin>>x;std::cout<<x<<std::endl;return 0;}",
            ),
            (
                Language::Rust,
                "use std::io::*;\nfn main(){let mut s=String::new();stdin().read_line(&mut s).unwrap();print!(\"{}\",s.trim());}",
            ),
            (
                Language::Java,
                "import java.util.Scanner;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);System.out.println(sc.nextInt());}}",
            ),
        ];

        let p = problem(&["7"], &["7"]);
        for (lang, code) in cases {
            let (report, _, _) = grade(code, *lang, &p, false).await;
            assert!(
                report.passed,
                "{:?} should pass a trivial echo, got: {:?}",
                lang, report.failure_details
            );
        }
    }

    #[tokio::test]
    async fn portugol_can_pass_a_trivial_echo() {
        // Separate from `every_language_can_pass_a_trivial_echo` because
        // Portugol needs Portugol syntax, not a shared echo snippet, and its
        // input goes through the space/newline normalization in
        // `runner::execute` before reaching the box's stdin file.
        let p = problem(&["7"], &["7"]);
        let code =
            "programa {\n\tfuncao inicio() {\n\t\tinteiro x\n\t\tleia(x)\n\t\tescreva(x)\n\t}\n}";
        let (report, _, _) = grade(code, Language::Portugol, &p, false).await;
        assert!(
            report.passed,
            "Portugol should pass a trivial echo, got: {:?}",
            report.failure_details
        );
    }

    #[tokio::test]
    async fn fork_bomb_is_capped_by_processes_limit() {
        // Python fork bomb via os.fork() in a loop — should hit isolate's
        // --processes=64 cap and fail (crash/killed), not hang the box or
        // spill into the host beyond the box's own cgroup.
        let p = problem(&["1"], &["1"]);
        let code = "import os\nwhile True: os.fork()";
        let (report, _, _) = grade(code, Language::Python, &p, false).await;
        assert!(
            !report.passed,
            "fork bomb should fail under the box's --processes cap, not pass or hang"
        );
    }

    #[tokio::test]
    async fn tle_is_detected_via_isolate_wall_time() {
        // Python busy-loop with no output — must be killed by isolate's
        // --wall-time, not just hang until the crate's own outer watchdog.
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
        assert!(
            !report.passed,
            "500MB allocation should fail under the 128MB box limit"
        );
        assert_eq!(report.verdict, SubmissionStatus::MEMORY_LIMIT_EXCEEDED);
    }

    #[tokio::test]
    async fn crash_is_a_runtime_error() {
        let p = problem(&["1"], &["1"]);
        let (report, _, _) = grade("print(1 // 0)", Language::Python, &p, false).await;
        assert_eq!(report.verdict, SubmissionStatus::RUNTIME_ERROR);
        let error = report.failure_details.unwrap().error.unwrap_or_default();
        assert!(error.contains("ZeroDivisionError"), "got: {error}");
    }

    #[tokio::test]
    async fn passing_report_has_passed_verdict() {
        let p = problem(&["1"], &["1"]);
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, false).await;
        assert_eq!(report.verdict, SubmissionStatus::PASSED);
    }

    #[tokio::test]
    async fn tokens_mode_ignores_spacing() {
        let mut p = problem(&["1 2"], &["1\n2"]);
        p.compare_mode = CompareMode::Tokens;
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, false).await;
        assert!(report.passed, "got: {:?}", report.failure_details);

        p.compare_mode = CompareMode::Exact;
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, false).await;
        assert_eq!(report.verdict, SubmissionStatus::WRONG_ANSWER);
    }

    // Accepts any output whose integers sum to the answer's.
    const SUM_CHECKER: &str = "import sys\nout=open(sys.argv[2]).read().split()\nans=open(sys.argv[3]).read().split()\nif sum(map(int,out))==sum(map(int,ans)):\n    sys.exit(0)\nprint('wrong sum')\nsys.exit(1)";

    #[tokio::test]
    async fn checker_accepts_alternative_answer() {
        let p = with_checker(problem(&["3"], &["1 2"]), Language::Python, SUM_CHECKER);
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, false).await;
        assert!(report.passed, "got: {:?}", report.failure_details);
    }

    #[tokio::test]
    async fn checker_rejection_is_wrong_answer_with_message() {
        let p = with_checker(problem(&["4"], &["1 2"]), Language::Python, SUM_CHECKER);
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, false).await;
        assert_eq!(report.verdict, SubmissionStatus::WRONG_ANSWER);
        let error = report.failure_details.unwrap().error.unwrap_or_default();
        assert!(error.contains("wrong sum"), "got: {error}");
    }

    #[tokio::test]
    async fn broken_checker_is_a_judge_error() {
        let p = with_checker(
            problem(&["1"], &["1"]),
            Language::Python,
            "import sys\nsys.exit(3)",
        );
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, false).await;
        assert_eq!(report.verdict, SubmissionStatus::ERROR);

        let p = with_checker(problem(&["1"], &["1"]), Language::C, "int main( {");
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, false).await;
        assert_eq!(report.verdict, SubmissionStatus::ERROR);
        assert_eq!(report.passed_count, 0);
    }

    // Custom runs (`code_run`) go through the same sandbox, so they live here
    // with the other isolate-backed tests.

    #[tokio::test]
    async fn run_echoes_custom_stdin() {
        let out = code_run::execute(
            "a, b = map(int, input().split())\nprint(a + b)",
            Language::Python,
            "3 4\n",
            1000,
        )
        .await;
        assert_eq!(out.status, models::CodeRunStatus::Ok);
        assert_eq!(out.exit_code, Some(0));
        assert_eq!(out.stdout.trim(), "7");
    }

    #[tokio::test]
    async fn run_reports_compile_error_and_runtime_error() {
        let out = code_run::execute("int main( {", Language::C, "", 1000).await;
        assert_eq!(out.status, models::CodeRunStatus::CompilationError);
        assert!(!out.stderr.is_empty());
        assert_eq!(out.exit_code, None);

        let out = code_run::execute(
            "import sys\nprint('partial')\nsys.exit(3)",
            Language::Python,
            "",
            1000,
        )
        .await;
        assert_eq!(out.status, models::CodeRunStatus::RuntimeError);
        assert_eq!(out.exit_code, Some(3));
        assert_eq!(out.stdout.trim(), "partial");
    }

    #[tokio::test]
    async fn run_uses_problem_time_limit() {
        let out = code_run::execute(BUSY_2S_C, Language::C, "1", 1000).await;
        assert_eq!(out.status, models::CodeRunStatus::TimeLimitExceeded);
        let out = code_run::execute(BUSY_2S_C, Language::C, "1", 4000).await;
        assert_eq!(out.status, models::CodeRunStatus::Ok);
    }

    #[tokio::test]
    async fn run_caps_large_output() {
        let out = code_run::execute("print('x' * 1_000_000)", Language::Python, "", 1000).await;
        assert_eq!(out.status, models::CodeRunStatus::Ok);
        assert!(out.stdout_truncated);
        assert_eq!(out.stdout.len(), code_run::MAX_RUN_OUTPUT_BYTES);
    }

    #[tokio::test]
    async fn run_normalizes_portugol_input() {
        let code = "programa {\n funcao inicio() {\n inteiro a, b\n leia(a)\n leia(b)\n escreva(a + b)\n }\n}";
        let out = code_run::execute(code, Language::Portugol, "3 4", 1000).await;
        assert_eq!(out.status, models::CodeRunStatus::Ok, "{out:?}");
        assert!(out.stdout.contains('7'), "got: {}", out.stdout);
    }

    const DOUBLE_C: &str =
        "#include <stdio.h>\nint main(){int x;scanf(\"%d\",&x);printf(\"%d\\n\",x*2);return 0;}";

    /// Runs `jobs` gradings across `slots` concurrent pool slots (each its own
    /// `isolate::WORKER_SLOT`, like the real worker pool) and returns each
    /// job's report, in job order.
    async fn grade_in_slots(
        jobs: Vec<(Language, &'static str, Problem)>,
        slots: u32,
    ) -> Vec<JudgeReport> {
        let queue = Arc::new(Mutex::new(jobs.into_iter().enumerate().collect::<Vec<_>>()));
        let handles: Vec<_> = (0..slots)
            .map(|slot| {
                let queue = queue.clone();
                tokio::spawn(isolate::WORKER_SLOT.scope(slot, async move {
                    let mut done = Vec::new();
                    loop {
                        let Some((i, (lang, code, p))) = queue.lock().unwrap().pop() else {
                            return done;
                        };
                        let (report, _, _) = grade(code, lang, &p, false).await;
                        done.push((i, report));
                    }
                }))
            })
            .collect();
        let mut all = Vec::new();
        for handle in handles {
            all.extend(handle.await.unwrap());
        }
        all.sort_by_key(|(i, _)| *i);
        all.into_iter().map(|(_, report)| report).collect()
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn concurrent_slots_grade_independently() {
        // Different programs and expectations on 4 slots at once: each must
        // get its own verdict, i.e. no two jobs ever share a box.
        let jobs = vec![
            (Language::C, DOUBLE_C, problem(&["1", "2"], &["2", "4"])),
            (Language::C, DOUBLE_C, problem(&["1", "2"], &["2", "5"])),
            (Language::C, "int main( {", problem(&["1"], &["1"])),
            (
                Language::Python,
                ECHO_CODE,
                problem(&["3", "4"], &["3", "4"]),
            ),
            (
                Language::Cpp,
                "#include <iostream>\nint main(){int x;std::cin>>x;std::cout<<x+1;}",
                problem(&["1"], &["2"]),
            ),
            (Language::Python, ECHO_CODE, problem(&["5"], &["6"])),
        ];
        let reports = grade_in_slots(jobs, 4).await;

        assert!(reports[0].passed, "got: {:?}", reports[0].failure_details);
        assert!(!reports[1].passed);
        assert_eq!(reports[1].passed_count, 1);
        let compile_error = reports[2].failure_details.as_ref().unwrap();
        assert!(
            compile_error
                .error
                .as_deref()
                .unwrap_or_default()
                .starts_with("Compilation Error:")
        );
        assert!(reports[3].passed, "got: {:?}", reports[3].failure_details);
        assert!(reports[4].passed, "got: {:?}", reports[4].failure_details);
        assert!(!reports[5].passed);
    }

    /// Throughput measurement for the thesis, not a correctness check:
    /// grades the same mixed batch with 1 slot (the old sequential judge)
    /// and with `BENCH_CONCURRENCY` slots (default 4), printing jobs/s.
    /// `cargo test --release throughput_bench -- --ignored --nocapture`
    #[tokio::test(flavor = "multi_thread")]
    #[ignore]
    async fn throughput_bench() {
        let env_num = |key: &str, default: u32| {
            std::env::var(key)
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default)
        };
        let jobs = env_num("BENCH_JOBS", 24) as usize;
        let concurrency = env_num("BENCH_CONCURRENCY", 4);

        let inputs = ["1", "2", "3", "4", "5"];
        let doubled = ["2", "4", "6", "8", "10"];
        let cases: [(Language, &'static str, Problem); 4] = [
            (Language::C, DOUBLE_C, problem(&inputs, &doubled)),
            (
                Language::Cpp,
                "#include <iostream>\nint main(){int x;std::cin>>x;std::cout<<2*x<<std::endl;}",
                problem(&inputs, &doubled),
            ),
            (
                Language::Python,
                "print(2*int(input()))",
                problem(&inputs, &doubled),
            ),
            (
                Language::Java,
                "public class Main{public static void main(String[] a){System.out.println(2*new java.util.Scanner(System.in).nextInt());}}",
                problem(&inputs, &doubled),
            ),
        ];
        let batch = || -> Vec<_> {
            (0..jobs)
                .map(|i| {
                    let (lang, code, p) = &cases[i % cases.len()];
                    (
                        *lang,
                        *code,
                        Problem {
                            inputs: p.inputs.clone(),
                            outputs: p.outputs.clone(),
                            time_limit_ms: p.time_limit_ms,
                            compare_mode: p.compare_mode,
                            float_epsilon: p.float_epsilon,
                            checker_language: p.checker_language,
                            checker_code: p.checker_code.clone(),
                        },
                    )
                })
                .collect()
        };

        let mut baseline = None;
        for slots in [1, concurrency] {
            let started = std::time::Instant::now();
            let reports = grade_in_slots(batch(), slots).await;
            let secs = started.elapsed().as_secs_f64();
            assert!(reports.iter().all(|r| r.passed), "bench batch must pass");
            let rate = jobs as f64 / secs;
            let speedup = baseline.map_or(1.0, |b| rate / b);
            baseline.get_or_insert(rate);
            println!(
                "BENCH slots={slots} jobs={jobs} wall={secs:.2}s throughput={rate:.2} jobs/s speedup={speedup:.2}x cpus={}",
                std::thread::available_parallelism().map_or(1, |n| n.get())
            );
        }
    }
}
