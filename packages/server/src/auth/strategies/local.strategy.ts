import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { UserService } from "src/user/user.service";
import { AuthService } from "../auth.service";
import { SigninDto } from "../dto/signin.dto";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(
		private userService: UserService,
		private authService: AuthService,
	) {
		super({
			usernameField: "email",
		});
	}

	async validate(email: string, password: string) {
		return await this.authService.validateLocalUser({
			email,
			password,
		});
	}
}
