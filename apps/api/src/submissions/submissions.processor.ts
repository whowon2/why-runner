import { exec } from "node:child_process";
import { promisify } from "node:util";
import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { SubmissionsService } from "./submissions.service";
import { Language, Submission } from "@prisma/client";
import { runCppJudge } from "src/runners/cpp-runner";
import { ProblemsService } from "src/problems/problems.service";

const asyncExec = promisify(exec);

@Processor("submission")
export class SubmissionsProcessor extends WorkerHost {
	constructor(
		private readonly submissionService: SubmissionsService,
		private readonly problemService: ProblemsService,
	) {
		super();
	}

	async process(job: Job) {
		const submission: Submission = job.data;

		console.log(`🚀 Processing submission ${job.id}`);

		const problem = await this.problemService.findOne(submission.problemId);

		if (!problem) {
			throw new Error("Problem not found");
		}

		try {
			const result = await runCppJudge(problem, submission);

			await this.submissionService.update(submission.id, {
				status: result.success ? "COMPLETED" : "ERROR",
				output: result.output,
			});

			return result;
		} catch (err) {
			await this.submissionService.update(submission.id, {
				status: "ERROR",
				output: err.message,
			});
			throw err;
		}
	}

	@OnWorkerEvent("completed")
	onCompleted(job: Job, result: { output: string }) {
		console.log(`✅ Submission ${job.id} processed successfully`);
		console.log(`Output: ${result.output}`);
	}

	@OnWorkerEvent("failed") onFailed(job: Job, err: Error) {
		console.error(`❌ Submission ${job.id} failed: ${err.message}`);
	}
}
