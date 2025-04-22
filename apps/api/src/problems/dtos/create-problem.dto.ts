import { Difficulty } from '@repo/db';
import { IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateProblemDto {
  @IsString()
  title: string;

  @IsNotEmpty()
  inputs: string[];

  @IsNotEmpty()
  outputs: string[];

  @IsString()
  difficulty: Difficulty;
}
