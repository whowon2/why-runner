import {
	Body,
	Controller,
	Delete,
	Get,
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
}
