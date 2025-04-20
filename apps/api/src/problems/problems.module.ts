import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';

@Module({
  providers: [ProblemsService],
  controllers: [ProblemsController],
})
export class ProblemsModule {}
