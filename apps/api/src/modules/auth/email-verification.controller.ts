import {
  Controller,
  Post,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  Response,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { EmailVerificationService } from './email-verification.service';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class EmailVerificationController {
  constructor(
    private readonly emailVerification: EmailVerificationService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Authenticated user clicks "Send verification email"
   */
  @Throttle({ default: rateLimitConfig.normal })
  @UseGuards(JwtAccessGuard)
  @Post('send-verification')
  async send(@Req() req: any) {
    try {
      const user = await this.emailVerification.sendVerificationEmail(
        req.user.sub,
      );
      return {
        success: true,
        message: 'Verification email sent',
        data: {
          userEmail: user.email,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }

  /**
   * This is the callback endpoint that the email link hits (public, no auth required)
   * Auto-logs in user by verifying token, creating session, and setting cookies
   * Same flow as login/register endpoints
   */
  @Get('verify-email')
  async verify(
    @Query('token') token: string,
    @Req() req: any,
    @Response() res: any,
  ) {
    console.log('[VERIFY EMAIL ENDPOINT] Token received:', token);

    if (!token) {
      console.log('[VERIFY EMAIL ENDPOINT] No token provided');
      throw new BadRequestException('Token query parameter is required');
    }

    try {
      console.log('[VERIFY EMAIL ENDPOINT] Verifying token...');
      const user = await this.emailVerification.verifyEmailToken(token);
      console.log('[VERIFY EMAIL ENDPOINT] Token verified successfully');

      // Issue tokens with session creation (same as login flow)
      const tokens = await this.authService.issueTokens(user.id, {
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress:
          req.headers['x-forwarded-for']?.toString().split(',')[0] ||
          req.ip ||
          'unknown',
      });

      // Set cookies (same pattern as login endpoint)
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

      if (tokens.sessionId) {
        res.cookie('sessionId', tokens.sessionId, {
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        });
      }

      // Return JSON response so frontend knows it was successful
      return res.json({
        success: true,
        message: 'Email verified successfully and logged in',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.log('[VERIFY EMAIL ENDPOINT] Verification failed:', errorMsg);
      throw new BadRequestException(errorMsg);
    }
  }
}
