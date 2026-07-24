import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';

@ApiTags('auth')
@Controller('auth')
export class PasswordResetController {
  constructor(private readonly passwordReset: PasswordResetService) {}

  /**
   * Public endpoint to request a password reset email
   * Does not reveal if email exists (for security)
   */
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({
    status: 200,
    description:
      'Password reset email sent (or no error if email not found for security)',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email',
  })
  @Throttle({ default: rateLimitConfig.strict })
  @Post('request-password-reset')
  async requestReset(@Body() dto: RequestPasswordResetDto) {
    return this.passwordReset.requestPasswordReset(dto.email);
  }

  /**
   * Public endpoint to reset password with token
   * User provides new password, token is verified, password is updated
   */
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token or password requirements not met',
  })
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
