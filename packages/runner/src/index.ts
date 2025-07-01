import {
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SQSClient,
} from '@aws-sdk/client-sqs';
import { z } from 'zod';
import { env } from './env';
import {
	getProblem,
	getSubmission,
	updateLeaderboard,
	updateSubmission,
} from './queries';
import { judge } from './runner';

const jobSchema = z.object({
	questionLetter: z.string(),
	submissionId: z.string(),
});

const sqs = new SQSClient({ region: env.AWS_REGION });
const QUEUE_URL = env.SQS_QUEUE_URL;

async function pollQueue() {
	console.log('Polling SQS...');

	while (true) {
		const response = await sqs.send(
			new ReceiveMessageCommand({
				QueueUrl: QUEUE_URL,
				MaxNumberOfMessages: 1,
				WaitTimeSeconds: 20, // long polling
			}),
		);

		console.log('Received messages:', response.Messages?.length);

		const messages = response.Messages ?? [];

		for (const msg of messages) {
			if (!msg.Body || !msg.ReceiptHandle) continue;

			try {
				console.log(msg.Body);
				const parsed = JSON.parse(msg.Body);
				const parseResult = jobSchema.safeParse(parsed);

				if (!parseResult.success) {
					console.error('Parse failed', parseResult.error);
					continue;
				}

				const { submissionId, questionLetter } = parseResult.data;

				const submission = await getSubmission(submissionId);
				if (!submission)
					throw new Error(`Submission ${submissionId} not found`);

				const problem = await getProblem(submission.problemId);
				if (!problem)
					throw new Error(`Problem ${submission.problemId} not found`);

				await updateSubmission(submissionId, 'RUNNING');

				const res = await judge(problem, submission);

				await updateSubmission(
					submissionId,
					res.passed ? 'PASSED' : 'FAILED',
					JSON.stringify(res ?? ''),
				);

				await updateLeaderboard(submission, questionLetter);

				// ✅ delete message from queue
				await sqs.send(
					new DeleteMessageCommand({
						QueueUrl: QUEUE_URL,
						ReceiptHandle: msg.ReceiptHandle,
					}),
				);
			} catch (err) {
				console.error('Error processing job:', err);
			}
		}
	}
}

pollQueue();
