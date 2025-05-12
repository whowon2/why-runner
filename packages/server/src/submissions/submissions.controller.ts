import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import type { Submission } from "@runner/db";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { UpdateSubmissionDto } from "./dto/update-submission.dto";
import { SubmissionsService } from "./submissions.service";

@Controller("submissions")
export class SubmissionsController {
	constructor(private readonly submissionsService: SubmissionsService) {}

	@Post()
	create(@Body() createSubmissionDto: CreateSubmissionDto) {
		return this.submissionsService.create(createSubmissionDto);
	}

	@Get()
	findAll() {
		return this.submissionsService.findAll();
	}

	@Get(":id")
	findOne(@Param("id") id: string): Promise<Submission> {
		return this.submissionsService.findOne(id);
	}

	@Patch(":id")
	update(
		@Param("id") id: string,
		@Body() updateSubmissionDto: UpdateSubmissionDto,
	) {
		return this.submissionsService.update(id, updateSubmissionDto);
	}
}
