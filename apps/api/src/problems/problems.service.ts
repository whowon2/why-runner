import { Injectable } from "@nestjs/common";
import { prisma, Problem } from "@repo/db";

@Injectable()
export class ProblemsService {

	async findOne(id: string): Promise<Problem | null> {
		return prisma.problem.findUnique({
			where: { id },
			include: {
				submissions: true,
			},
		});
	}
}
