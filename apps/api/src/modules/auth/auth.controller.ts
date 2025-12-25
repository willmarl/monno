import { Controller, Post, Body, Req, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered, tokens set in cookies',
    schema: { example: { success: true } },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
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

  @ApiOperation({ summary: 'Log in with username and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully logged in, tokens set in cookies',
    schema: { example: { success: true } },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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

  @ApiOperation({ summary: 'Log out the current user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully logged out, tokens cleared',
    schema: { example: { success: true } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({
    status: 201,
    description: 'Tokens successfully refreshed',
    schema: { example: { success: true } },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
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
