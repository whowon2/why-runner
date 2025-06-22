import { sql } from 'bun';
import type { Problem, Submission, SubmissionStatus } from '../types';

export async function getSubmission(id: string) {
	const [submission] = await sql`
      SELECT * FROM "Submission" WHERE id = ${id}
    `;

	return submission as Submission;
}

export async function getProblem(id: string) {
	const [problem] = await sql`
    SELECT * FROM "Problem" WHERE id = ${id}
    `;

	return problem as Problem;
}

export async function updateSubmission(
	id: string,
	status: SubmissionStatus,
	output = '',
) {
	await sql`
    UPDATE "Submission"
    SET status = ${status},
    output = ${output}
    WHERE id = ${id}
    `;
}

export async function updateLeaderboard(
	submission: Submission,
	questionLetter: string,
) {
	await sql`
    UPDATE "UserOnContest"
    SET score = score + 1,
    answers = array_append(answers, ${questionLetter})
    WHERE "contestId" = ${submission.contestId}
    AND "userId" = ${submission.userId}
  `;
}
