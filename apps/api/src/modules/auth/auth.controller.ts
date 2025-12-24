import { Controller, Post, Body, Req, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('refresh')
  refresh(@Req() req: any) {
    const userId = Number(req.body.userId);
    const token = req.body.refreshToken;

    return this.authService.refreshToken(userId, token);
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    const userId = req.user.sub;

    await this.authService.clearRefreshToken(userId);

    // clear cookies
    res.cookie('accessToken', '', {
      httpOnly: true,
      expires: new Date(0),
    });
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    return { success: true };
  }
}
