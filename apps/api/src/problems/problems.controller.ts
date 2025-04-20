import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Problem } from '@repo/db';
import { CreateProblemDto } from './dtos/create-problem.dto';
import { ProblemsService } from './problems.service';

@Controller('problems')
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

  @Delete(':id')
  async deleteProblem(@Param('id') id: string): Promise<Problem> {
    const problem = await this.problemsService.findOne(id);
    if (!problem)
      throw new HttpException(
        `Problem with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    return this.problemsService.delete(id);
  }
}
