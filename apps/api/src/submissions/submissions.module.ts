import { Module } from "@nestjs/common";
import { SubmissionsService } from "./submissions.service";
import { SubmissionsController } from "./submissions.controller";
import { BullModule } from "@nestjs/bullmq";
import { SubmissionsProcessor } from "./submissions.processor";
import { ProblemsService } from "../problems/problems.service";

@Module({
	controllers: [SubmissionsController],
	providers: [
		SubmissionsService,
		SubmissionsProcessor,
		ProblemsService,
	],
	imports: [
		BullModule.forRoot({
			connection: {
				host: "localhost",
				port: 6379,
			},
		}),
		BullModule.registerQueue({ name: "submission" }),
	],
})
export class SubmissionsModule {}
