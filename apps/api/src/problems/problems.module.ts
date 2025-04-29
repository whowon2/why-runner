import { Module } from "@nestjs/common";
import { ProblemsService } from "./problems.service";

@Module({
	providers: [ProblemsService],
})
export class ProblemsModule {}
