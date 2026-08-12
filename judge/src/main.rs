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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    // DB
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    println!("Connecting to database...");
    let db = DbClient::new(&database_url)
        .await
        .expect("Failed to connect to DB");
    println!("Database connected");

    // PgListener
    let mut listener = PgListener::connect(&database_url).await?;
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

    let (mut report, runtime_ms, memory_kb) = grade(&sub.code, sub.language, &problem).await;
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

    let (report, runtime_ms, _memory_kb) =
        grade(&validation.code, validation.language, &problem).await;

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
/// of `problem`, stopping at the first TLE / compile error / runtime error /
/// wrong answer, same as the student-submission path. Used by both real
/// submissions and pre-publish validation runs so the two can never grade
/// differently.
async fn grade(
    code: &str,
    language: Language,
    problem: &Problem,
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

        if result.is_timeout {
            all_passed = false;
            failure_details = Some(TestCaseResult {
                index: i + 1,
                input: input.clone(),
                expected: expected.clone(),
                actual: "Execution timed out".to_string(),
                error: Some(format!("Time Limit Exceeded ({}s)", time_limit)),
            });

            println!("\t⏳ TLE on Test {}", i + 1);
            break;
        } else if result.is_compile_error {
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
        } else if result.exit_code != 0 {
            // CASE 1: Runtime Error (Crash)
            all_passed = false;
            failure_details = Some(TestCaseResult {
                index: i + 1,
                input: input.clone(), // We save the input that killed it
                expected: expected.clone(),
                actual: actual,             // Sometimes partial output exists
                error: Some(result.stderr), // The Traceback
            });
            println!("\t❌ Runtime Error on Test {}", i + 1);
            break; // Stop testing
        } else if actual.trim() != expected.trim() {
            // CASE 2: Wrong Answer
            all_passed = false;
            failure_details = Some(TestCaseResult {
                index: i + 1,
                input: input.clone(),
                expected: expected.clone(),
                actual: actual,
                error: None,
            });
            println!("\t❌ Wrong Answer on Test {}", i + 1);
            break; // Stop testing
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
