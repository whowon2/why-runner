mod constraints;
mod db;
mod models;
mod runner;

use sqlx::postgres::PgListener;
use std::env;
use tokio::time::{Duration, timeout};

use crate::{
    db::DbClient,
    models::{
        ConstraintKind, JudgeReport, Language, Problem, ProblemConstraint, ProblemValidation,
        Submission, SubmissionStatus, TestCaseResult,
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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    // DB
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    println!("Connecting to database...");
    let db = connect_with_retry("Database", || DbClient::new(&database_url)).await;
    println!("Database connected");

    // PgListener
    let mut listener = connect_with_retry("PgListener", || PgListener::connect(&database_url)).await;
    listener.listen("new_submission").await?;
    listener.listen("new_validation").await?;
    println!("Listening for 'new_submission' and 'new_validation' notifications...");

    loop {
        // 0. Dead-letter submissions abandoned by a crashed/killed worker that
        // already exhausted their retry budget, so they aren't reclaimed below.
        match db.reap_exhausted_submissions().await {
            Ok(n) if n > 0 => println!("Dead-lettered {} exhausted submission(s)", n),
            Ok(_) => {}
            Err(e) => eprintln!("Failed to reap exhausted submissions: {}", e),
        }

        // 1. Try to fetch any pending (or crashed-worker-abandoned) submission
        println!("Checking for pending jobs...");
        loop {
            match db.get_next_submission().await {
                Ok(Some(sub)) => {
                    if sub.retry_count > 0 {
                        println!(
                            "Processing submission: {} (retry {}/{})",
                            sub.id,
                            sub.retry_count,
                            db::MAX_RETRIES
                        );
                    } else {
                        println!("Processing submission: {}", sub.id);
                    }
                    process_job(&db, sub).await;
                }
                Ok(None) => break,
                Err(e) => {
                    eprintln!("Failed to fetch next submission: {}", e);
                    break;
                }
            }
        }

        // 1b. Same drain, for pending problem validation runs.
        println!("Checking for pending validation jobs...");
        loop {
            match db.get_next_validation().await {
                Ok(Some(validation)) => {
                    println!("Processing validation: {}", validation.id);
                    process_validation_job(&db, validation).await;
                }
                Ok(None) => break,
                Err(e) => {
                    eprintln!("Failed to fetch next validation: {}", e);
                    break;
                }
            }
        }

        // 2. No more jobs? Wait for a notification OR a periodic sweep (60s)
        println!("No pending jobs. Sleeping until notification...");

        let wait_result = timeout(Duration::from_secs(60), listener.recv()).await;

        match wait_result {
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
                println!("Periodic sweep (60s timeout reached)");
            }
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
        return (SubmissionStatus::FAILED, None);
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
/// pre-publish validation), stops at the first TLE / compile error / runtime
/// error / wrong answer, same as before this parameter existed. When
/// `run_all` is true (lesson exercises), keeps running every remaining test
/// case after a TLE/runtime-error/wrong-answer so `passed_count` reflects
/// true correctness — only a compile error still stops immediately either
/// way, since it applies identically to every test case. `failure_details`
/// always captures just the first failure encountered, matching
/// `JudgeReport`'s single-`Option<TestCaseResult>` shape.
async fn grade(
    code: &str,
    language: Language,
    problem: &Problem,
    run_all: bool,
) -> (JudgeReport, i64, Option<i64>) {
    let total_tests = problem.inputs.len();
    let mut passed_count = 0;
    let mut failure_details: Option<TestCaseResult> = None;
    let mut all_passed = true;
    let mut runtime_ms: i64 = 0;
    let mut memory_kb: Option<i64> = None;

    for (i, input) in problem.inputs.iter().enumerate() {
        let expected = match problem.outputs.get(i) {
            Some(o) => o,
            None => {
                eprintln!("Missing expected output for test case {}", i + 1);
                all_passed = false;
                break;
            }
        };
        let time_limit = 20;

        // Run code
        let result = runner::run(code, input, language, time_limit).await;
        let actual = result.stdout.trim().to_string();
        runtime_ms += result.duration_ms;
        if let Some(kb) = result.peak_memory_kb {
            memory_kb = Some(memory_kb.map_or(kb, |current| current.max(kb)));
        }

        if result.is_compile_error {
            // Always stops, even when run_all: a compile error is identical
            // on every test case (the code never runs), so re-running it
            // would only waste sandbox time for no new information.
            all_passed = false;
            failure_details = Some(TestCaseResult {
                index: i + 1,
                input: input.clone(),
                expected: expected.clone(),
                actual: String::new(),
                error: Some(format!("Compilation Error:\n{}", result.stderr)),
            });

            println!("\t🛠️ Compile Error on Test {}", i + 1);
            break;
        } else if result.is_timeout {
            all_passed = false;
            if failure_details.is_none() {
                failure_details = Some(TestCaseResult {
                    index: i + 1,
                    input: input.clone(),
                    expected: expected.clone(),
                    actual: "Execution timed out".to_string(),
                    error: Some(format!("Time Limit Exceeded ({}s)", time_limit)),
                });
            }

            println!("\t⏳ TLE on Test {}", i + 1);
            if !run_all {
                break;
            }
        } else if result.exit_code != 0 {
            // CASE 1: Runtime Error (Crash)
            all_passed = false;
            if failure_details.is_none() {
                failure_details = Some(TestCaseResult {
                    index: i + 1,
                    input: input.clone(), // We save the input that killed it
                    expected: expected.clone(),
                    actual: actual.clone(), // Sometimes partial output exists
                    error: Some(result.stderr.clone()), // The Traceback
                });
            }
            println!("\t❌ Runtime Error on Test {}", i + 1);
            if !run_all {
                break;
            }
        } else if actual.trim() != expected.trim() {
            // CASE 2: Wrong Answer
            all_passed = false;
            if failure_details.is_none() {
                failure_details = Some(TestCaseResult {
                    index: i + 1,
                    input: input.clone(),
                    expected: expected.clone(),
                    actual: actual.clone(),
                    error: None,
                });
            }
            println!("\t❌ Wrong Answer on Test {}", i + 1);
            if !run_all {
                break;
            }
        } else {
            passed_count += 1;
        }
    }

    // Prepare the Report
    let report = JudgeReport {
        passed: all_passed,
        total_tests,
        passed_count,
        failure_details,
        constraint_violation: None,
    };

    (report, runtime_ms, memory_kb)
}

#[cfg(test)]
mod grade_tests {
    use super::*;

    // A tiny Python script that reads one int per line and echoes it back —
    // correct for `expected == input`, wrong otherwise. Cheap and fast to
    // run through the real Python sandbox (needs Docker running locally,
    // same as production).
    const ECHO_CODE: &str = "print(input())";

    fn problem(inputs: &[&str], outputs: &[&str]) -> Problem {
        Problem {
            inputs: inputs.iter().map(|s| s.to_string()).collect(),
            outputs: outputs.iter().map(|s| s.to_string()).collect(),
        }
    }

    #[tokio::test]
    async fn run_all_keeps_going_past_a_mid_suite_failure() {
        // Test 2 is wrong (expects "wrong", echo prints the input back), so
        // a stop-at-first-failure grade would never see tests 3+.
        let p = problem(&["1", "2", "3"], &["1", "wrong", "3"]);
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, true).await;

        assert!(!report.passed);
        assert_eq!(report.total_tests, 3);
        assert_eq!(report.passed_count, 2, "should count tests 1 and 3 as passed despite the failure at test 2");
        assert_eq!(report.failure_details.unwrap().index, 2, "failure_details should still capture only the first failure");
    }

    #[tokio::test]
    async fn stop_at_first_failure_when_run_all_is_false() {
        let p = problem(&["1", "2", "3"], &["1", "wrong", "3"]);
        let (report, _, _) = grade(ECHO_CODE, Language::Python, &p, false).await;

        assert!(!report.passed);
        assert_eq!(report.total_tests, 3);
        assert_eq!(report.passed_count, 1, "should stop after test 2 and never run test 3");
    }

    #[tokio::test]
    async fn compile_error_stops_immediately_regardless_of_run_all() {
        // Python has no compile step (see `run_python`), so this needs a
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
}
