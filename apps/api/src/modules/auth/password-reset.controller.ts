import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PasswordResetService } from './password-reset.service';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly passwordReset: PasswordResetService) {}

  /**
   * Public endpoint to request a password reset email
   * Does not reveal if email exists (for security)
   */
  @Throttle({ default: rateLimitConfig.normal })
  @Post('request-password-reset')
  async requestReset(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }

    return this.passwordReset.requestPasswordReset(body.email);
  }

  /**
   * Public endpoint to reset password with token
   * User provides new password, token is verified, password is updated
   */
  @Throttle({ default: rateLimitConfig.strict })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      return await this.passwordReset.resetPassword(dto.token, dto.newPassword);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }
}
