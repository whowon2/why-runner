import { IsNotEmpty, Min } from "class-validator";

export class CreateProblemDto {
	@IsNotEmpty()
	title: string;

	@IsNotEmpty()
	inputs: string[];

	@IsNotEmpty()
	outputs: string[];
}
