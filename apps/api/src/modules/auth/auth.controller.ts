import { Controller, Post, Body, Req, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Throttle } from '@nestjs/throttler';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { cookieConfig } from 'src/config/cookie.config';

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
  @Throttle({ default: rateLimitConfig.normal })
  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    const tokens = await this.authService.register(body, req);

    res.cookie('accessToken', tokens.accessToken, cookieConfig.accessToken);
    res.cookie('refreshToken', tokens.refreshToken, cookieConfig.refreshToken);

    if (tokens.sessionId) {
      res.cookie('sessionId', tokens.sessionId, cookieConfig.sessionId);
    }

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
  @Throttle({ default: rateLimitConfig.normal })
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    const tokens = await this.authService.login(body, req);

    res.cookie('accessToken', tokens.accessToken, cookieConfig.accessToken);
    res.cookie('refreshToken', tokens.refreshToken, cookieConfig.refreshToken);

    if (tokens.sessionId) {
      res.cookie('sessionId', tokens.sessionId, cookieConfig.sessionId);
    }

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
    const sessionId = req.cookies['sessionId'];

    // Invalidate session if it exists
    if (sessionId) {
      await this.authService.invalidateSession(sessionId);
    }

    // Clear cookies
    res.cookie('accessToken', '', cookieConfig.clear);
    res.cookie('refreshToken', '', cookieConfig.clear);
    res.cookie('sessionId', '', cookieConfig.clear);

    return { success: true };
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout-all')
  async logoutAll(@Req() req, @Res({ passthrough: true }) res) {
    const userId = req.user.sub;

    // Invalidate all sessions for this user
    await this.authService.invalidateAllSessions(userId);

    // Clear cookies
    res.cookie('accessToken', '', cookieConfig.clear);
    res.cookie('refreshToken', '', cookieConfig.clear);
    res.cookie('sessionId', '', cookieConfig.clear);

    return { success: true };
  }

  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({
    status: 201,
    description: 'Tokens successfully refreshed',
    schema: { example: { success: true } },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @Throttle({ default: rateLimitConfig.normal })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res) {
    const { sub: userId, refreshToken } = req.user;
    const sessionId = req.cookies['sessionId'];

    // Try session-based refresh first (if sessionId exists)
    // Fall back to user-based refresh for backward compatibility
    let result;
    if (sessionId) {
      result = await this.authService.refreshTokensBySession(
        sessionId,
        refreshToken,
      );
    } else {
      result = await this.authService.refreshTokens(userId, refreshToken);
    }

    res.cookie('accessToken', result.accessToken, cookieConfig.accessToken);
    res.cookie('refreshToken', result.refreshToken, cookieConfig.refreshToken);

    if (result.sessionId) {
      res.cookie('sessionId', result.sessionId, cookieConfig.sessionId);
    }

    return { success: true };
  }
}
