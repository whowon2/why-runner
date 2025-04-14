import { Language } from "@prisma/client";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSubmissionDto {
	@IsNotEmpty()
	language: Language;

	@IsNotEmpty()
	code: string;

	@IsNotEmpty()
	@IsString()
	problemId: string;
}
