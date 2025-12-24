import { Controller, Post, Body, Req, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res) {
    const tokens = await this.authService.register(body);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    return { success: true };
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res) {
    const tokens = await this.authService.login(body);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    return { success: true };
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

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res) {
    const { sub: userId, refreshToken } = req.user;

    const { accessToken, refreshToken: newRefresh } =
      await this.authService.refreshTokens(userId, refreshToken);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    return { success: true };
  }
}
