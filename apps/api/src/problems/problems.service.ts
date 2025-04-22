import { Injectable } from '@nestjs/common';
import { prisma, Prisma, PrismaClient, Problem } from '@repo/db';
import { CreateProblemDto } from './dtos/create-problem.dto';

@Injectable()
export class ProblemsService {
  database: PrismaClient = prisma;

  async create(input: CreateProblemDto): Promise<Problem> {
    return this.database.problem.create({
      data: input,
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

  async delete(id: string): Promise<Problem> {
    return this.database.problem.delete({
      where: { id },
    });
  }
}
