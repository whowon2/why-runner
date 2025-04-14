import { Injectable } from "@nestjs/common";
import { Prisma, Problem } from "@prisma/client";
import { DatabaseService } from "src/database/database.service";
import { CreateProblemDto } from "./dtos/create-problem.dto";

@Injectable()
export class ProblemsService {
	constructor(private readonly database: DatabaseService) {}

	async create(input: CreateProblemDto): Promise<Problem> {
		return this.database.problem.create({
			data: {
				title: input.title,
				inputs: input.inputs,
				outputs: input.outputs,
			},
		});
	}

	async findAll(): Promise<Problem[]> {
		return this.database.problem.findMany({});
	}

	async findOne(id: string): Promise<Problem | null> {
		return this.database.problem.findUnique({
			where: { id },
		});
	}

	async update(id: string, input: Prisma.ProblemUpdateInput): Promise<Problem> {
		return this.database.problem.update({
			where: { id },
			data: input,
		});
	}

	async remove(id: string): Promise<Problem> {
		return this.database.problem.delete({
			where: { id },
		});
	}
}
