import { PartialType } from "@nestjs/mapped-types";
import { SubmissionStatus } from "@runner/db";
import { CreateSubmissionDto } from "./create-submission.dto";

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
	status?: SubmissionStatus;
	output?: string;
}
