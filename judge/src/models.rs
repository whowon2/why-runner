use serde::Serialize;
use sqlx::{FromRow, Type};
use uuid::Uuid;

#[derive(Debug, Type, Serialize, PartialEq, Clone, Copy)]
#[sqlx(type_name = "submission_status", rename_all = "UPPERCASE")]
pub enum SubmissionStatus {
    PENDING,
    PASSED,
    /// Legacy: rows judged before the distinct verdicts below existed. Still
    /// written for failed `problem_validation` runs, never for submissions.
    FAILED,
    /// Judge-side fault (dead-lettered row, sandbox or checker failure).
    ERROR,
    RUNNING,
    CONSTRAINT_VIOLATION,
    PENDING_CONSTRAINT_CLASSIFICATION,
    WRONG_ANSWER,
    TIME_LIMIT_EXCEEDED,
    MEMORY_LIMIT_EXCEEDED,
    COMPILATION_ERROR,
    RUNTIME_ERROR,
}

/// How a run's stdout is compared with the declared output (`compare.rs`).
#[derive(Debug, Type, PartialEq, Clone, Copy)]
#[sqlx(type_name = "problem_compare_mode", rename_all = "lowercase")]
pub enum CompareMode {
    Exact,
    Tokens,
    Float,
    /// Run the author's `problem_checker` program.
    Checker,
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
    /// Set only when this submission was made against a lesson's exercise.
    /// Solution constraints are an exercise-only feature (never contests,
    /// never standalone/practice submissions) — the judge only runs
    /// structural analysis / requests classification when this is `Some`.
    pub exercise_id: Option<Uuid>,
}

/// Outcome of an ungraded "run with custom input" (`code_run` table). Never
/// `PASSED`/`WRONG_ANSWER`: a run has no expected output.
#[derive(Debug, Type, PartialEq, Clone, Copy)]
#[sqlx(type_name = "code_run_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CodeRunStatus {
    Pending,
    Running,
    /// Exited with code 0.
    Ok,
    RuntimeError,
    TimeLimitExceeded,
    MemoryLimitExceeded,
    CompilationError,
    /// Judge-side fault (sandbox failure, judge restarted mid-run).
    Error,
}

/// A claimed `code_run` row: the student's program and their own stdin.
/// Deliberately carries nothing from the problem but its id, which is only
/// used to look up the time limit (`DbClient::get_problem_time_limit`), so a
/// run can never see test data.
#[derive(Debug, FromRow)]
pub struct CodeRun {
    pub id: Uuid,
    pub code: String,
    pub language: Language,
    pub problem_id: Uuid,
    pub stdin: String,
}

#[derive(Debug, FromRow)]
pub struct Problem {
    pub inputs: Vec<String>,
    pub outputs: Vec<String>,
    /// Author-set per-test CPU limit; the judge scales it per language
    /// (`runner::time_limit_secs`).
    pub time_limit_ms: i32,
    pub compare_mode: CompareMode,
    pub float_epsilon: f64,
    /// From `problem_checker`; only set when the author saved one.
    pub checker_language: Option<Language>,
    pub checker_code: Option<String>,
}

#[derive(Debug, Type, Clone, Copy, PartialEq)]
#[sqlx(type_name = "problem_constraint_kind", rename_all = "snake_case")]
pub enum ConstraintKind {
    Structural,
    AlgorithmRequirement,
}

#[derive(Debug, Type, Clone, Copy, PartialEq)]
#[sqlx(
    type_name = "structural_constraint_rule_type",
    rename_all = "snake_case"
)]
pub enum StructuralRuleType {
    MaxLoopNestingDepth,
    ForbiddenConstruct,
    RequiredConstruct,
}

/// A single row of `exercise_constraint` (constraints are an exercise-only
/// feature, never attached to `problem` directly — see `Submission::exercise_id`).
/// `rule_type`/`rule_params` are only set when `kind == Structural`;
/// `description` only when `kind == AlgorithmRequirement`. Fetched
/// separately, see `DbClient::get_exercise_constraints`.
#[derive(Debug, FromRow)]
pub struct ProblemConstraint {
    pub kind: ConstraintKind,
    pub rule_type: Option<StructuralRuleType>,
    /// Raw JSON text, shape depends on `rule_type` (e.g. `{"maxDepth":1}` or
    /// `{"constructs":["goto"]}`). Parsed on demand in `constraints.rs`.
    pub rule_params: Option<String>,
    pub description: Option<String>,
}

/// Result of judge-side structural static analysis: which rule (if any) the
/// submitted source violated.
#[derive(Debug, Serialize, Clone)]
pub struct ConstraintViolation {
    pub rule: String,
    pub message: String,
}

/// A pre-publish validation run: a professor's reference solution graded
/// against a draft problem's declared I/O. Deliberately has no
/// `retry_count`/contest fields — unlike `Submission`, a stuck/crashed run is
/// just abandoned rather than retried, since re-validating is a single click
/// away and there's no student-facing consequence to a stale RUNNING row.
#[derive(Debug, FromRow)]
pub struct ProblemValidation {
    pub id: Uuid,
    pub code: String,
    pub language: Language,
    pub problem_id: Uuid,
}

#[derive(Serialize, Debug)]
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
    /// `PASSED`, or the verdict of the first failing test case (or
    /// `COMPILATION_ERROR` / `ERROR` when the submission never ran).
    pub verdict: SubmissionStatus,
    pub total_tests: usize,
    pub passed_count: usize,
    pub failure_details: Option<TestCaseResult>, // None if all passed
    /// Set when all test cases passed but a structural constraint was
    /// violated. `None` when there were no structural constraints, or when
    /// I/O grading already failed (structural analysis is skipped in that
    /// case, see design.md "Keep the AI classification call cheap and rare").
    pub constraint_violation: Option<ConstraintViolation>,
}
