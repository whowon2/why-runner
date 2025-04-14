import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
} from "@nestjs/common";
import { ProblemsService } from "./problems.service";
import { Prisma, Problem } from "@prisma/client";
import { CreateProblemDto } from "./dtos/create-problem.dto";

@Controller("problems")
export class ProblemsController {
	constructor(private readonly problemsService: ProblemsService) {}

	@Get()
	async findAllProblems(): Promise<Problem[]> {
		return this.problemsService.findAll();
	}

	@Post()
	async createProblem(@Body() problemData: CreateProblemDto): Promise<Problem> {
		return this.problemsService.create(problemData);
	}

	@Delete(":id")
	async deleteProblem(@Param("id") id: string): Promise<Problem> {
		const problem = await this.problemsService.findOne(id);
		if (!problem)
			throw new HttpException(
				`Problem with id ${id} not found`,
				HttpStatus.NOT_FOUND,
			);
		return this.problemsService.delete(id);
	}
}
