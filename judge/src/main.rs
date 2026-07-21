mod db;
mod models;
mod runner;

use sqlx::postgres::PgListener;
use std::env;
use tokio::time::{Duration, timeout};

use crate::{
    db::DbClient,
    models::{JudgeReport, Submission, SubmissionStatus, TestCaseResult},
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
    println!("Listening for 'new_submission' notifications...");

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
                            sub.id, sub.retry_count, db::MAX_RETRIES
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

    println!(
        "\tJudging Submission {} (Language: {:?})",
        sub.id, sub.language
    );

    let total_tests = problem.inputs.len();
    let mut passed_count = 0;
    let mut failure_details: Option<TestCaseResult> = None;
    let mut all_passed = true;

    for (i, input) in problem.inputs.iter().enumerate() {
        let expected = match problem.outputs.get(i) {
            Some(o) => o,
            None => {
                eprintln!("Problem {} missing expected output for test case {}", sub.problem_id, i + 1);
                all_passed = false;
                break;
            }
        };
        let time_limit = 20;

        // Run code
        let result = runner::run(&sub.code, input, sub.language, time_limit).await;
        let actual = result.stdout.trim().to_string();

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
    };

    // Serialize to JSON String
    let output_json = serde_json::to_string(&report).unwrap_or_default();
    let status = if all_passed {
        SubmissionStatus::PASSED
    } else {
        SubmissionStatus::FAILED
    };

    // Save to DB
    if let Err(e) = db
        .update_submission_result(&sub, status, &output_json)
        .await
    {
        eprintln!("❌ Failed to update DB: {}", e);
    } else {
        println!("\t💾 Result Saved.");
    }
}
