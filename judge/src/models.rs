use serde::Serialize;
use sqlx::{FromRow, Type};
use uuid::Uuid;

#[derive(Debug, Type, Serialize, PartialEq, Clone, Copy)]
#[sqlx(type_name = "submission_status", rename_all = "UPPERCASE")]
pub enum SubmissionStatus {
    PENDING,
    PASSED,
    FAILED,
    ERROR,
    RUNNING,
}

#[derive(Debug, Type, Serialize, PartialEq, Clone, Copy)]
#[sqlx(type_name = "language", rename_all = "lowercase")]
pub enum Language {
    C,
    Cpp,
    Java,
    Python,
    Portugol,
    Rust,
}

#[derive(Debug, FromRow)]
pub struct Submission {
    pub id: Uuid,
    pub code: String,
    pub language: Language,
    pub problem_id: Uuid,
    pub user_id: String,
    pub contest_id: Option<Uuid>,
    pub question_letter: Option<String>,
    pub retry_count: i32,
}

#[derive(Debug, FromRow)]
pub struct Problem {
    pub inputs: Vec<String>,
    pub outputs: Vec<String>,
}

#[derive(Serialize)]
pub struct TestCaseResult {
    pub input: String,
    pub expected: String,
    pub actual: String,
    pub error: Option<String>, // For Runtime Errors (stderr)
    pub index: usize,
}

#[derive(Serialize)]
pub struct JudgeReport {
    pub passed: bool,
    pub total_tests: usize,
    pub passed_count: usize,
    pub failure_details: Option<TestCaseResult>, // None if all passed
}
