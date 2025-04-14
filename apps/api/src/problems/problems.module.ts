import { Module } from "@nestjs/common";
import { ProblemsController } from "./problems.controller";
import { ProblemsService } from "./problems.service";
import { DatabaseService } from "src/database/database.service";

@Module({
	providers: [ProblemsService, DatabaseService],
	controllers: [ProblemsController],
})
export class ProblemsModule {}
