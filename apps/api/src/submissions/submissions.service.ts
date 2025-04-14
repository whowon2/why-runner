import { Injectable } from "@nestjs/common";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { UpdateSubmissionDto } from "./dto/update-submission.dto";
import { DatabaseService } from "src/database/database.service";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class SubmissionsService {
	constructor(
		@InjectQueue("submission") private readonly submissionQueue: Queue,
		private readonly database: DatabaseService,
	) {}

	async create(dto: CreateSubmissionDto) {
		const submission = await this.database.submission.create({ data: dto });

		console.log(`Submission created with ID: ${submission.id}`);

		const queue = await this.submissionQueue.add(submission.id, submission);

		console.log(`Submission queued with ID: ${submission.id}`);

		console.log(queue.id);

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
