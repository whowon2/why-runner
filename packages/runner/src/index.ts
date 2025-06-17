import { Worker } from "bullmq";
import Redis from "ioredis";
import { z } from "zod";
import { cppJudge } from "../cpp";
import { rustJudge } from "../rust";
import { getProblem, getSubmission, updateSubmission } from "./queries";

function getRunner(language: "cpp" | "rust") {
	switch (language) {
		case "cpp":
			return cppJudge;
		case "rust":
			return rustJudge;
		default:
			throw new Error("Invalid Language");
	}
}

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 0
});

const jobSchema = z.object({
	submissionId: z.string(),
});

new Worker(
	"submissions",
	async (job) => {
		console.log(job.data);
		const parseResult = jobSchema.safeParse(job.data);

		if (!parseResult.success) {
			throw new Error("Parse Fail");
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

			await updateSubmission(submissionId, "RUNNING");

			const runner = getRunner(submission.language);

			const res = await runner(problem, submission);

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
