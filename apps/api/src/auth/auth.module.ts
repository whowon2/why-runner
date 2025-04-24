import { Module } from "@nestjs/common";
import { UserService } from "src/user/user.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import jwtConfig from "./config/jwt.config";
import { LocalStrategy } from "./strategies/local.strategy";
import { ConfigModule } from "@nestjs/config";
import refreshConfig from "./config/refresh.config";

@Module({
	imports: [
		JwtModule.registerAsync(jwtConfig.asProvider()),
		ConfigModule.forFeature(jwtConfig),
		ConfigModule.forFeature(refreshConfig),
	],
	controllers: [AuthController],
	providers: [UserService, AuthService, LocalStrategy],
})
export class AuthModule {}
