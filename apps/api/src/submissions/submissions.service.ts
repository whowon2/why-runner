import { InjectQueue } from "@nestjs/bullmq";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { prisma, PrismaClient, Problem, Submission } from "@repo/db";
import { Queue } from "bullmq";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { UpdateSubmissionDto } from "./dto/update-submission.dto";
import { FileLogger } from "../logger/file-logger";
import { ProblemsService } from "../problems/problems.service";

type SubmissionData = {
	submission: Submission;
	problem: Problem;
};

@Injectable()
export class SubmissionsService {
	database: PrismaClient = prisma;

	constructor(
		@InjectQueue("submission")
		private readonly submissionQueue: Queue<SubmissionData>,
		private readonly logger: FileLogger,
		private readonly problemService: ProblemsService,
	) {}

	async create(dto: CreateSubmissionDto) {
		const problem = await this.problemService.findOne(dto.problemId);

		if (!problem) {
			throw new HttpException("Problem not found", HttpStatus.NOT_FOUND);
		}

		const submission = await prisma.submission.create({ data: dto });

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

	async findOne(id: string): Promise<Submission> {
		const submission = await this.database.submission.findUnique({
			where: { id },
		});

		if (!submission) {
			throw new HttpException("Submission not found", HttpStatus.NOT_FOUND);
		}

		return submission;
	}

	async update(id: string, updateSubmissionDto: UpdateSubmissionDto) {
		const submission = await this.database.submission.findUnique({
			where: { id },
		});

		if (!submission) {
			throw new HttpException("Submission not found", HttpStatus.NOT_FOUND);
		}

		return this.database.submission.update({
			where: { id },
			data: updateSubmissionDto,
		});
	}

	async remove(id: string) {
		return this.database.submission.delete({ where: { id } });
	}
}
