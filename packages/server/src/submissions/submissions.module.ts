import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaService } from "src/database.service";
import { ProblemsService } from "../problems/problems.service";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsProcessor } from "./submissions.processor";
import { SubmissionsService } from "./submissions.service";

@Module({
	controllers: [SubmissionsController],
	providers: [
		SubmissionsService,
		SubmissionsProcessor,
		ProblemsService,
		PrismaService,
	],
	imports: [
		ConfigModule, // Import here too if not global
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				connection: {
					url: configService.get<string>("REDIS_URL"),
				},
			}),
		}),
		BullModule.registerQueue({ name: "submission" }),
	],
})
export class SubmissionsModule {}
