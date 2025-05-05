import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { BullModule } from '@nestjs/bullmq';
import { SubmissionsProcessor } from './submissions.processor';
import { ProblemsService } from '../problems/problems.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsProcessor, ProblemsService],
  imports: [
    ConfigModule, // Import here too if not global
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'submission' }),
  ],
})
export class SubmissionsModule {}
