import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "src/database.service";
import { UserService } from "src/user/user.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import jwtConfig from "./config/jwt.config";
import refreshConfig from "./config/refresh.config";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
	imports: [
		JwtModule.registerAsync(jwtConfig.asProvider()),
		ConfigModule.forFeature(jwtConfig),
		ConfigModule.forFeature(refreshConfig),
	],
	controllers: [AuthController],
	providers: [UserService, AuthService, LocalStrategy, PrismaService],
})
export class AuthModule {}
