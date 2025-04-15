import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { UpdateSubmissionDto } from "./dto/update-submission.dto";
import { DatabaseService } from "src/database/database.service";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { FileLogger } from "src/logger/file-logger";
import { ProblemsService } from "src/problems/problems.service";
import { Problem, Submission } from "@prisma/client";

type SubmissionData = {
	submission: Submission;
	problem: Problem;
};

@Injectable()
export class SubmissionsService {
	constructor(
		@InjectQueue("submission")
		private readonly submissionQueue: Queue<SubmissionData>,
		private readonly database: DatabaseService,
		private readonly logger: FileLogger,
		private readonly problemService: ProblemsService,
	) {}

	async create(dto: CreateSubmissionDto) {
		const problem = await this.problemService.findOne(dto.problemId);

		if (!problem) {
			throw new HttpException("Problem not found", HttpStatus.NOT_FOUND);
		}

		const submission = await this.database.submission.create({ data: dto });

		this.logger.log("Service", `Submission created: ${submission.id}`);

		const queue = await this.submissionQueue.add(submission.id, {
			submission,
			problem,
		});

		return submission;
	}

	findAll() {
		return this.database.submission.findMany();
	}

	findOne(id: string) {
		return this.database.submission.findUnique({ where: { id } });
	}

	update(id: string, updateSubmissionDto: UpdateSubmissionDto) {
		return this.database.submission.update({
			where: { id },
			data: updateSubmissionDto,
		});
	}

	remove(id: string) {
		return this.database.submission.delete({ where: { id } });
	}
}
