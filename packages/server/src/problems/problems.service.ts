import { Injectable } from "@nestjs/common";
import { Problem, } from "@runner/db";
import { PrismaService } from "src/database.service";

@Injectable()
export class ProblemsService {
	constructor(private database: PrismaService) {}

	async findOne(id: string): Promise<Problem | null> {
		return this.database.problem.findUnique({
			where: { id },
			include: {
				submissions: true,
			},
		});
	}
}
