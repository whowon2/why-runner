import { Worker } from "bullmq";
import Redis from "ioredis";
import { z } from "zod";
import { cppJudge } from "../cpp";
import { getProblem, getSubmission, updateSubmission } from "./queries";

const connection = new Redis({
	maxRetriesPerRequest: 0,
});

const jobSchema = z.object({
	submissionId: z.string(),
});

new Worker(
	"submissions",
	async (job) => {
		console.log(job.id);
		const parseResult = jobSchema.safeParse(job.data);

		if (!parseResult.success) {
			throw new Error("Parse Fail");
		}

		const { submissionId } = parseResult.data;

		console.log(parseResult.data);

		try {
			const submission = await getSubmission(submissionId);

			if (!submission) {
				throw new Error(`Submission ${submissionId} not found`);
			}

			const problem = await getProblem(submission.problemId);

			if (!problem) {
				throw new Error(`Problem ${submission.problemId} not found`);
			}

			await updateSubmission(submissionId, "RUNNING");

			const res = await cppJudge(problem, submission);

			await updateSubmission(
				submissionId,
				res.passed ? "PASSED" : "FAILED",
				JSON.stringify(res ?? ""),
			);
		} catch (err) {
			console.error(err);
			try {
				await updateSubmission(submissionId, "ERROR");
			} catch (err) {
				console.error(err);
			}
		}
	},
	{ connection },
);

console.log("waiting for submissions...");
