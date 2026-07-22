use crate::models::{Problem, Submission, SubmissionStatus};
use sqlx::{PgPool, Result};
use uuid::Uuid;

/// A submission stuck in RUNNING for longer than this was almost certainly
/// left behind by a worker that crashed or was killed mid-job.
const STALE_RUNNING_THRESHOLD: &str = "5 minutes";

/// Stale jobs get re-claimed and retried up to this many times before being
/// dead-lettered (moved to ERROR) instead of retried forever.
pub const MAX_RETRIES: i32 = 3;

pub struct DbClient {
    pool: PgPool,
}

impl DbClient {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPool::connect(database_url).await?;
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

    pub async fn get_next_submission(&self) -> Result<Option<Submission>> {
        sqlx::query_as::<_, Submission>(&format!(
            "UPDATE submission
             SET status = 'RUNNING',
                 updated_at = now(),
                 retry_count = CASE WHEN status = 'RUNNING' THEN retry_count + 1 ELSE retry_count END
             WHERE id = (
                 SELECT id FROM submission
                 WHERE status = 'PENDING'
                    OR (status = 'RUNNING' AND retry_count < $1 AND updated_at < now() - interval '{}')
                 ORDER BY created_at ASC
                 FOR UPDATE SKIP LOCKED
                 LIMIT 1
             )
             RETURNING id, code, language, problem_id, user_id, contest_id, question_letter, retry_count",
            STALE_RUNNING_THRESHOLD
        ))
        .bind(MAX_RETRIES)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn get_problem(&self, problem_id: Uuid) -> Result<Problem> {
        sqlx::query_as::<_, Problem>(
            "SELECT inputs, outputs FROM problem WHERE id = $1",
        )
        .bind(problem_id)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn update_submission_result(
        &self,
        submission: &Submission,
        status: SubmissionStatus,
        output: &str,
    ) -> Result<()> {
        let mut tx = self.pool.begin().await?;

        // 1. Update the submission record
        sqlx::query("UPDATE submission SET status = $1, output = $2 WHERE id = $3")
            .bind(status)
            .bind(output)
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
}
