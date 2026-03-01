import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class PasswordResetController {
  constructor(private readonly passwordReset: PasswordResetService) {}

  /**
   * Public endpoint to request a password reset email
   * Does not reveal if email exists (for security)
   */
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description: 'User email address',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Password reset email sent (or no error if email not found for security)',
  })
  @ApiResponse({
    status: 400,
    description: 'Email is required',
  })
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
