use crate::code_run::RunOutcome;
use crate::models::{
    CodeRun, Problem, ProblemConstraint, ProblemValidation, Submission, SubmissionStatus,
};
use sqlx::{PgPool, Result, postgres::PgPoolOptions};
use uuid::Uuid;

/// A submission stuck in RUNNING for longer than this was almost certainly
/// left behind by a worker that crashed or was killed mid-job.
const STALE_RUNNING_THRESHOLD: &str = "5 minutes";

/// Stale jobs get re-claimed and retried up to this many times before being
/// dead-lettered (moved to ERROR) instead of retried forever.
pub const MAX_RETRIES: i32 = 3;

/// Rows `get_next_submission` may claim: pending, or abandoned by a crashed
/// worker with retries left. `$1` is `MAX_RETRIES`.
fn claimable_submission() -> String {
    format!(
        "status = 'PENDING'
            OR (status = 'RUNNING' AND retry_count < $1 AND updated_at < now() - interval '{}')",
        STALE_RUNNING_THRESHOLD
    )
}

/// A run still RUNNING after this long was lost by a crashed/restarted
/// worker. Runs get no retries: the student just clicks Run again.
const STALE_RUN_THRESHOLD: &str = "2 minutes";

/// Runs are scratch work, deleted by the dispatcher sweep after this long.
const RUN_RETENTION: &str = "24 hours";

/// A row the judge has already claimed (set to `RUNNING`).
pub enum Claimed<T> {
    Ready(T),
    /// Claimed, but loading it failed: usually a row written by a newer
    /// website (a language/enum label or column this judge doesn't know).
    /// The caller must fail it so it never sits `RUNNING` with no owner.
    Unloadable {
        id: Uuid,
        error: sqlx::Error,
    },
}

impl<T> Claimed<T> {
    fn from_load(id: Uuid, row: Result<T>) -> Self {
        match row {
            Ok(row) => Claimed::Ready(row),
            Err(error) => Claimed::Unloadable { id, error },
        }
    }
}

pub struct DbClient {
    pool: PgPool,
}

impl DbClient {
    /// `max_connections` should cover one in-flight query per pool worker
    /// plus the dispatcher's reaper (see main.rs).
    pub async fn new(database_url: &str, max_connections: u32) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .connect(database_url)
            .await?;
        Ok(Self { pool })
    }

    /// Dead-letters submissions that have been RUNNING since before a crashed
    /// worker claimed them, and have already exhausted their retry budget.
    /// Must run before `get_next_submission` so exhausted rows are not
    /// picked up again.
    pub async fn reap_exhausted_submissions(&self) -> Result<u64> {
        let result = sqlx::query(&format!(
            "UPDATE submission
             SET status = 'ERROR',
                 output = 'Dead-lettered: exceeded {} retries after repeated worker crash/timeout'
             WHERE status = 'RUNNING'
               AND retry_count >= $1
               AND updated_at < now() - interval '{}'",
            MAX_RETRIES, STALE_RUNNING_THRESHOLD
        ))
        .bind(MAX_RETRIES)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// Claims the next claimable submission. The claim returns only the id
    /// (it touches nothing but `status`/`updated_at`/`retry_count`) and the
    /// row is loaded separately, so a row this judge can't decode (e.g. a
    /// newer website wrote a language or column it doesn't know) comes back
    /// as `Claimed::Unloadable` instead of failing the whole claim: the
    /// caller fails it with the reason, and the rest of the queue moves on.
    pub async fn get_next_submission(&self) -> Result<Option<Claimed<Submission>>> {
        let id: Option<Uuid> = sqlx::query_scalar(&format!(
            "UPDATE submission
             SET status = 'RUNNING',
                 updated_at = now(),
                 retry_count = CASE WHEN status = 'RUNNING' THEN retry_count + 1 ELSE retry_count END
             WHERE id = (
                 SELECT id FROM submission
                 WHERE {}
                 ORDER BY created_at ASC
                 FOR UPDATE SKIP LOCKED
                 LIMIT 1
             )
             RETURNING id",
            claimable_submission()
        ))
        .bind(MAX_RETRIES)
        .fetch_optional(&self.pool)
        .await?;
        let Some(id) = id else { return Ok(None) };

        let row = sqlx::query_as::<_, Submission>(
            "SELECT id, code, language, problem_id, user_id, contest_id, question_letter, retry_count, exercise_id
             FROM submission WHERE id = $1",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await;
        Ok(Some(Claimed::from_load(id, row)))
    }

    /// Ends a claimed submission as a judge-side `ERROR` (never penalised)
    /// with `reason` as its output, instead of leaving it `RUNNING` for the
    /// stale-reclaim/dead-letter path.
    pub async fn fail_submission(&self, id: Uuid, reason: &str) -> Result<()> {
        sqlx::query("UPDATE submission SET status = 'ERROR', output = $1 WHERE id = $2")
            .bind(reason)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get_problem(&self, problem_id: Uuid) -> Result<Problem> {
        sqlx::query_as::<_, Problem>(
            "SELECT p.inputs, p.outputs, p.time_limit_ms, p.compare_mode, p.float_epsilon,
                    c.language AS checker_language, c.code AS checker_code
             FROM problem p
             LEFT JOIN problem_checker c ON c.problem_id = p.id
             WHERE p.id = $1",
        )
        .bind(problem_id)
        .fetch_one(&self.pool)
        .await
    }

    /// All active solution constraints for an exercise (structural rules,
    /// and the at-most-one algorithm-requirement description). Empty for
    /// exercises with no constraints configured. Constraints are an
    /// exercise-only feature — never looked up by `problem_id`, see
    /// `Submission::exercise_id`.
    pub async fn get_exercise_constraints(
        &self,
        exercise_id: Uuid,
    ) -> Result<Vec<ProblemConstraint>> {
        sqlx::query_as::<_, ProblemConstraint>(
            "SELECT kind, rule_type, rule_params, description
             FROM exercise_constraint
             WHERE exercise_id = $1",
        )
        .bind(exercise_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_submission_result(
        &self,
        submission: &Submission,
        status: SubmissionStatus,
        output: &str,
        runtime_ms: i64,
        memory_kb: Option<i64>,
        constraint_violation_detail: Option<&str>,
    ) -> Result<()> {
        let mut tx = self.pool.begin().await?;

        // 1. Update the submission record
        sqlx::query(
            "UPDATE submission SET status = $1, output = $2, runtime_ms = $3, memory_kb = $4, constraint_violation_detail = $5 WHERE id = $6",
        )
        .bind(status)
        .bind(output)
        .bind(runtime_ms)
        .bind(memory_kb)
        .bind(constraint_violation_detail)
        .bind(submission.id)
        .execute(&mut *tx)
        .await?;

        // 2. If the submission PASSED and is tied to a contest, update the
        // user's leaderboard entry. Lesson submissions have no contest_id /
        // question_letter and skip this step entirely.
        if status == SubmissionStatus::PASSED {
            if let (Some(contest_id), Some(question_letter)) =
                (submission.contest_id, &submission.question_letter)
            {
                sqlx::query(
                    "UPDATE user_on_contest
                     SET answered = array_append(answered, $1)
                     WHERE user_id = $2 AND contest_id = $3
                     AND NOT ($1 = ANY(answered))",
                )
                .bind(question_letter)
                .bind(&submission.user_id)
                .bind(contest_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(())
    }

    /// Claims one PENDING `problem_validation` row, same atomic
    /// claim-and-lock shape as `get_next_submission` (safe for multiple
    /// judge-worker replicas). No stale-`RUNNING` reclaim: unlike student
    /// submissions, an abandoned validation run has no retry budget — the
    /// professor just clicks "Validate" again, which creates a fresh row.
    pub async fn get_next_validation(&self) -> Result<Option<Claimed<ProblemValidation>>> {
        let id: Option<Uuid> = sqlx::query_scalar(
            "UPDATE problem_validation
             SET status = 'RUNNING',
                 updated_at = now()
             WHERE id = (
                 SELECT id FROM problem_validation
                 WHERE status = 'PENDING'
                 ORDER BY created_at ASC
                 FOR UPDATE SKIP LOCKED
                 LIMIT 1
             )
             RETURNING id",
        )
        .fetch_optional(&self.pool)
        .await?;
        let Some(id) = id else { return Ok(None) };

        let row = sqlx::query_as::<_, ProblemValidation>(
            "SELECT id, code, language, problem_id FROM problem_validation WHERE id = $1",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await;
        Ok(Some(Claimed::from_load(id, row)))
    }

    /// Ends a claimed validation as `ERROR` with `reason` as its output.
    pub async fn fail_validation(&self, id: Uuid, reason: &str) -> Result<()> {
        sqlx::query("UPDATE problem_validation SET status = 'ERROR', output = $1 WHERE id = $2")
            .bind(reason)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// Claims one PENDING `code_run`, same atomic claim-and-lock shape as
    /// `get_next_validation`. No stale-`RUNNING` reclaim: `reap_stale_runs`
    /// fails abandoned runs instead.
    pub async fn get_next_run(&self) -> Result<Option<Claimed<CodeRun>>> {
        let id: Option<Uuid> = sqlx::query_scalar(
            "UPDATE code_run
             SET status = 'RUNNING',
                 updated_at = now()
             WHERE id = (
                 SELECT id FROM code_run
                 WHERE status = 'PENDING'
                 ORDER BY created_at ASC
                 FOR UPDATE SKIP LOCKED
                 LIMIT 1
             )
             RETURNING id",
        )
        .fetch_optional(&self.pool)
        .await?;
        let Some(id) = id else { return Ok(None) };

        let row = sqlx::query_as::<_, CodeRun>(
            "SELECT id, code, language, problem_id, stdin FROM code_run WHERE id = $1",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await;
        Ok(Some(Claimed::from_load(id, row)))
    }

    /// Ends a claimed run as `ERROR` with `reason` as its stderr.
    pub async fn fail_run(&self, id: Uuid, reason: &str) -> Result<()> {
        sqlx::query("UPDATE code_run SET status = 'ERROR', stderr = $1 WHERE id = $2")
            .bind(reason)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// The only problem data a run may read: never its tests or checker.
    pub async fn get_problem_time_limit(&self, problem_id: Uuid) -> Result<i32> {
        sqlx::query_scalar("SELECT time_limit_ms FROM problem WHERE id = $1")
            .bind(problem_id)
            .fetch_one(&self.pool)
            .await
    }

    pub async fn update_run_result(&self, run_id: Uuid, outcome: &RunOutcome) -> Result<()> {
        sqlx::query(
            "UPDATE code_run
             SET status = $1, stdout = $2, stderr = $3, stdout_truncated = $4,
                 stderr_truncated = $5, exit_code = $6, runtime_ms = $7, memory_kb = $8
             WHERE id = $9",
        )
        .bind(outcome.status)
        .bind(&outcome.stdout)
        .bind(&outcome.stderr)
        .bind(outcome.stdout_truncated)
        .bind(outcome.stderr_truncated)
        .bind(outcome.exit_code)
        .bind(outcome.runtime_ms as i32)
        .bind(outcome.memory_kb.map(|kb| kb as i32))
        .bind(run_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Fails runs left RUNNING by a crashed or restarted worker.
    pub async fn reap_stale_runs(&self) -> Result<u64> {
        let result = sqlx::query(&format!(
            "UPDATE code_run
             SET status = 'ERROR',
                 stderr = 'The judge restarted during this run. Run it again.'
             WHERE status = 'RUNNING'
               AND updated_at < now() - interval '{}'",
            STALE_RUN_THRESHOLD
        ))
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// Deletes runs older than `RUN_RETENTION`.
    pub async fn prune_old_runs(&self) -> Result<u64> {
        let result = sqlx::query(&format!(
            "DELETE FROM code_run WHERE created_at < now() - interval '{}'",
            RUN_RETENTION
        ))
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// Whether `get_next_submission` / `get_next_run` / `get_next_validation` would claim
    /// something right now. The idle auto-stop checks this before exiting, so
    /// a job whose notification is what woke the dispatcher still gets
    /// drained by the workers instead of being left PENDING.
    pub async fn has_claimable_jobs(&self) -> Result<bool> {
        sqlx::query_scalar(&format!(
            "SELECT EXISTS (SELECT 1 FROM submission WHERE {})
                 OR EXISTS (SELECT 1 FROM problem_validation WHERE status = 'PENDING')
                 OR EXISTS (SELECT 1 FROM code_run WHERE status = 'PENDING')",
            claimable_submission()
        ))
        .bind(MAX_RETRIES)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn update_validation_result(
        &self,
        validation_id: Uuid,
        status: SubmissionStatus,
        output: &str,
        runtime_ms: i64,
    ) -> Result<()> {
        sqlx::query(
            "UPDATE problem_validation SET status = $1, output = $2, runtime_ms = $3 WHERE id = $4",
        )
        .bind(status)
        .bind(output)
        .bind(runtime_ms)
        .bind(validation_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::Claimed;
    use uuid::Uuid;

    #[test]
    fn claimed_keeps_the_id_when_loading_fails() {
        let id = Uuid::new_v4();
        let claimed: Claimed<()> = Claimed::from_load(id, Err(sqlx::Error::RowNotFound));
        match claimed {
            Claimed::Unloadable { id: got, error } => {
                assert_eq!(got, id);
                assert!(matches!(error, sqlx::Error::RowNotFound));
            }
            Claimed::Ready(_) => panic!("a failed load must not be Ready"),
        }
    }

    #[test]
    fn claimed_is_ready_when_loading_succeeds() {
        let claimed = Claimed::from_load(Uuid::new_v4(), Ok(7));
        assert!(matches!(claimed, Claimed::Ready(7)));
    }
}
