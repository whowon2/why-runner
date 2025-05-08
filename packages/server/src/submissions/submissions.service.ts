import { InjectQueue } from "@nestjs/bullmq";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaClient, Problem, Submission, prisma } from "@runner/db";
import { Queue } from "bullmq";
import { PrismaService } from "src/database.service";
import { ProblemsService } from "../problems/problems.service";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { UpdateSubmissionDto } from "./dto/update-submission.dto";

type SubmissionData = {
	submission: Submission;
	problem: Problem;
};

@Injectable()
export class SubmissionsService {
	constructor(
		@InjectQueue("submission")
		private readonly submissionQueue: Queue<SubmissionData>,
		private readonly problemService: ProblemsService,
		private database: PrismaService,
	) {}

	async create(dto: CreateSubmissionDto) {
		const problem = await this.problemService.findOne(dto.problemId);

		if (!problem) {
			throw new HttpException("Problem not found", HttpStatus.NOT_FOUND);
		}

		const submission = await this.database.submission.create({ data: dto });

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
}
