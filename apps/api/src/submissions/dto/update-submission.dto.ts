import { PartialType } from "@nestjs/mapped-types";
import { CreateSubmissionDto } from "./create-submission.dto";
import { SubmissionStatus } from "@repo/db";

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
	status?: SubmissionStatus;
	output?: string;
}
