import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Problem, Submission } from "@runner/db";
import type { Job } from "bullmq";
import type { ProblemsService } from "../problems/problems.service";
import { runCppJudge } from "../runners/cpp-runner";
import type { SubmissionsService } from "./submissions.service";

@Processor("submission")
export class SubmissionsProcessor extends WorkerHost {
	constructor(
		private readonly submissionService: SubmissionsService,
		private readonly problemService: ProblemsService,
	) {
		super();
	}

	async process(job: Job) {
		const { submission, problem } = job.data as {
			submission: Submission;
			problem: Problem;
		};

		try {
			const { output } = await runCppJudge(problem, submission);

			await this.submissionService.update(submission.id, {
				status: "COMPLETED",
				output: output,
			});

			return output;
		} catch (err) {
			await this.submissionService.update(submission.id, {
				status: "ERROR",
				output: err.message,
			});

			throw new Error("Submission failed");
		}
	}

	// @OnWorkerEvent("completed")
	// onCompleted(job: Job, result: { output: string }) {
	// 	console.log(`✅ Submission ${job.id} processed successfully`);
	// 	console.log("Processor", `Output: ${result.output}`);
	// }

	// @OnWorkerEvent("failed")
	// onFailed(job: Job, err: Error) {
	// 	console.error(`❌ Submission ${job.id} failed: ${err.message}`);
	// }
}
