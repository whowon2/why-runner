import { Language } from "@prisma/client";
import { IsNotEmpty } from "class-validator";

export class CreateSubmissionDto {
	@IsNotEmpty()
	language: Language;

	@IsNotEmpty()
	code: string;
}
