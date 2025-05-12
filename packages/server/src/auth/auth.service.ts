import {
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "argon2";
import { CreateUserDto } from "src/user/dto/create-user.dto";
import { UserService } from "src/user/user.service";
import refreshConfig from "./config/refresh.config";
import { SigninDto } from "./dto/signin.dto";
import type { AuthJwtPayload } from "./types/jwt";

@Injectable()
export class AuthService {
	constructor(
		@Inject(refreshConfig.KEY)
		private refreshTokenConfig: ConfigType<typeof refreshConfig>,
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
	) {}

	async signin(dto: SigninDto) {
		const { accessToken, refreshToken } = await this.generateTokens(dto.id);

		const hashedRt = await hash(refreshToken);

		await this.userService.update(dto.id, {
			hashedRefreshToken: hashedRt,
		});

		return {
			...dto,
			accessToken,
			refreshToken,
		};
	}

	async signup(dto: CreateUserDto) {
		return this.userService.create(dto);
	}

	async validateLocalUser(dto: { email: string; password: string }) {
		const user = await this.userService.findByEmail(dto.email);

		if (!user) {
			throw new UnauthorizedException("Email not found");
		}

		const isPasswordValid = await verify(user.password, dto.password);

		if (!isPasswordValid) {
			throw new UnauthorizedException("Invalid password");
		}

		return {
			id: user.id,
			name: user.name,
			role: user.role,
			image: user.image,
			email: user.email,
		};
	}

	async generateTokens(userId: string) {
		const payload: AuthJwtPayload = { sub: userId };

		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(payload),
			this.jwtService.signAsync(payload, this.refreshTokenConfig),
		]);

		return { accessToken, refreshToken };
	}
}
