import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { SigninDto } from './dto/signin.dto';
import { LocalAuthGuard } from './guards/local.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signup(@Body() dto: CreateUserDto) {
    return await this.authService.signup(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  async signin(
    @Request()
    req: {
      user: {
        id: string;
        name: string;
        role: string;
        image: string;
        email: string;
      };
    },
  ) {
    return await this.authService.signin({
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
      email: req.user.email,
      image: req.user.image,
    });
  }
}
