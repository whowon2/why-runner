import { Module } from "@nestjs/common";
import { PrismaService } from "src/database.service";
import { ProblemsService } from "./problems.service";

@Module({
	providers: [ProblemsService, PrismaService],
})
export class ProblemsModule {}
