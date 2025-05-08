import { Module } from "@nestjs/common";
import { PrismaService } from "src/database.service";
import { UserService } from "./user.service";

@Module({
	providers: [UserService, PrismaService],
})
export class UserModule {}
