import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { z } from 'zod';
import {
	getProblem,
	getSubmission,
	updateLeaderboard,
	updateSubmission,
} from './queries';
import { judge } from './runner';

const connection = new Redis(process.env.REDIS_URL, {
	maxRetriesPerRequest: 0,
});

const jobSchema = z.object({
	submissionId: z.string(),
});

new Worker(
	'submissions',
	async (job) => {
		console.log(job.data);
		const parseResult = jobSchema.safeParse(job.data);

		if (!parseResult.success) {
			throw new Error('Parse Fail');
		}

		const { submissionId } = parseResult.data;

		try {
			const submission = await getSubmission(submissionId);

			if (!submission) {
				throw new Error(`Submission ${submissionId} not found`);
			}

			const problem = await getProblem(submission.problemId);

			if (!problem) {
				throw new Error(`Problem ${submission.problemId} not found`);
			}

			await updateSubmission(submissionId, 'RUNNING');

			console.log({submission})

			const res = await judge(problem, submission);

			await updateSubmission(
				submissionId,
				res.passed ? 'PASSED' : 'FAILED',
				JSON.stringify(res ?? ''),
			);

			await updateLeaderboard(submission);
		} catch (err) {
			console.error(err);
			try {
				await updateSubmission(submissionId, 'ERROR');
			} catch (err) {
				console.error(err);
			}
		}
	},
	{ connection },
);

console.log('waiting for submissions...');
