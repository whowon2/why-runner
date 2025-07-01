import { sql } from 'bun';
import type { Problem, Submission, SubmissionStatus } from '../types';

export async function getSubmission(id: string) {
	console.log('get submission', id);
	const [submission] = await sql`
		SELECT id, code, language, output, "userId", "problemId", "contestId"
		FROM "Submission"
		WHERE id = ${id}
	`;

	return submission as Submission;
}

export async function getProblem(id: string): Promise<Problem | undefined> {
	console.log('get problem', id);
	const [problem] = await sql`
        SELECT *
        FROM "Problem"
        WHERE id = ${id};
    `;

	console.log({ problem });

	return problem as Problem;
}

export async function updateSubmission(
	id: string,
	status: SubmissionStatus,
	output = '',
) {
	console.log('update submission');
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
	score: number,
) {
	await sql`
    UPDATE "UserOnContest"
    SET score = score + ${score},
    answers = array_append(answers, ${questionLetter})
    WHERE "contestId" = ${submission.contestId}
    AND "userId" = ${submission.userId}
  `;
}
