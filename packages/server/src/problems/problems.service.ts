import { Injectable } from "@nestjs/common";
import type { Problem } from "@runner/db";
import { PrismaService } from "src/database.service";

@Injectable()
export class ProblemsService {
	constructor(private readonly database: PrismaService) {}

	async findOne(id: string): Promise<Problem | null> {
		return await this.database.problem.findUnique({
			where: { id },
			include: {
				submissions: true,
			},
		});
	}
}
