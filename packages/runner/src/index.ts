import {
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";
import { z } from "zod";
import { env } from "./env";
import { getProblem, getSubmission, updateSubmission } from "./queries";
import { judge } from "./runner";

const jobSchema = z.object({
	questionLetter: z.string(),
	submissionId: z.string(),
});

const sqs = new SQSClient({ region: env.AWS_REGION });
const QUEUE_URL = env.SQS_QUEUE_URL!;

async function pollQueue() {
	console.log("Polling SQS...");

	while (true) {
		const response = await sqs.send(
			new ReceiveMessageCommand({
				QueueUrl: QUEUE_URL,
				MaxNumberOfMessages: 1,
				WaitTimeSeconds: 20, // long polling
			}),
		);

		const messages = response.Messages ?? [];

		for (const msg of messages) {
			if (!msg.Body || !msg.ReceiptHandle) continue;

			try {
				const parsed = JSON.parse(msg.Body);
				const parseResult = jobSchema.safeParse(parsed);

				if (!parseResult.success) {
					console.error("Parse failed");
					continue;
				}

				const { submissionId } = parseResult.data;

				const submission = await getSubmission(submissionId);
				if (!submission)
					throw new Error(`Submission ${submissionId} not found`);

				const problem = await getProblem(submission.problemId);
				if (!problem)
					throw new Error(`Problem ${submission.problemId} not found`);

				await updateSubmission(submissionId, "RUNNING");

				const res = await judge(problem, submission);

				await updateSubmission(
					submissionId,
					res.passed ? "PASSED" : "FAILED",
					JSON.stringify(res ?? ""),
				);

				// ✅ delete message from queue
				await sqs.send(
					new DeleteMessageCommand({
						QueueUrl: QUEUE_URL,
						ReceiptHandle: msg.ReceiptHandle,
					}),
				);
			} catch (err) {
				console.error("Error processing job:", err);
			}
		}
	}
}

pollQueue();
