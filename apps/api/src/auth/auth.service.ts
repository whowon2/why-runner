import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { SigninDto } from './dto/signin.dto';
import { hash, verify } from 'argon2';
import { AuthJwtPayload } from './types/jwt';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import refreshConfig from './config/refresh.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(refreshConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshConfig>,
  ) {}

  async signin(dto: SigninDto) {
    console.log({ dto });
    const { accessToken, refreshToken } = await this.generateTokens(dto.id);

    const hashedRT = await hash(refreshToken);

    await this.userService.update(dto.id, {
      hashedRefreshToken: hashedRT,
    });

    return {
      id: dto.id,
      name: dto.name,
      role: dto.role,
      accessToken,
      refreshToken,
    };
  }

  async signup(dto: CreateUserDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (user) {
      throw new ConflictException('Email already used');
    }

    return this.userService.create(dto);
  }

  async validateLocalUser(dto: { email: string; password: string }) {
    console.log(dto);
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email not found');
    }

    const isPasswordValid = await verify(user.password, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return { id: user.id, name: user.name, role: user.role };
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
