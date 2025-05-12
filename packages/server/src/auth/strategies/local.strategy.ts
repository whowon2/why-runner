import { Injectable, } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import type { UserService } from "src/user/user.service";
import type { AuthService } from "../auth.service";

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
