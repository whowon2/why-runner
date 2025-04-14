import { exec } from "node:child_process";
import { promisify } from "node:util";
import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { SubmissionsService } from "./submissions.service";
import { Language } from "@prisma/client";

const asyncExec = promisify(exec);

@Processor("submission")
export class SubmissionsProcessor extends WorkerHost {
	constructor(private readonly submissionService: SubmissionsService) {
		super();
	}

	async process(job: Job) {
		if (!job.id) {
			throw new Error("Job ID is missing");
		}

		console.log(`🚀 Processing submission ${job.id}`);

		const { language, code, id } = job.data as {
			language: string;
			code: string;
			id: string;
		};

		try {
			const output = await this.runCode(language, code);

			// ✅ Update submission as SUCCESS
			await this.submissionService.update(id, {
				status: "COMPLETED",
			});

			return { success: true, output };
		} catch (error) {
			// ❌ Update submission as ERROR
			await this.submissionService.update(id, {
				status: "ERROR",
			});

			throw error;
		}
	}

	async runCode(language: string, code: string): Promise<string> {
		const command = `docker run --rm -i ${language} ${code}`;
		const { stdout, stderr } = await asyncExec(command);

		if (stderr) {
			throw new Error(stderr);
		}

		return stdout;
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
