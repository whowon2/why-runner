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
    CONSTRAINT_VIOLATION,
    PENDING_CONSTRAINT_CLASSIFICATION,
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

#[derive(Debug, FromRow)]
pub struct Problem {
    pub inputs: Vec<String>,
    pub outputs: Vec<String>,
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
    /// Set when all test cases passed but a structural constraint was
    /// violated. `None` when there were no structural constraints, or when
    /// I/O grading already failed (structural analysis is skipped in that
    /// case, see design.md "Keep the AI classification call cheap and rare").
    pub constraint_violation: Option<ConstraintViolation>,
}
