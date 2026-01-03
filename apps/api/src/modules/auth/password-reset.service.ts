import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { randomBytes } from 'crypto';
import { QueueService } from '../queue/queue.service';
import { resetPasswordTemplate } from '../../common/email-templates/ResetPassword';
import * as bcrypt from 'bcrypt';

// Helper functions (lightweight alternative to date-fns)
const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

const isBefore = (date1: Date, date2: Date): boolean => {
  return date1.getTime() < date2.getTime();
};

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  private generateToken() {
    return randomBytes(32).toString('hex'); // long, unguessable
  }

  async requestPasswordReset(email: string) {
    // Find user by email (case-insensitive)
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      // Don't reveal if email exists for security
      console.log('[PASSWORD RESET] Email not found:', email);
      return {
        success: true,
        message:
          'If an account exists with this email, a reset link has been sent',
      };
    }

    // If user doesn't have a password (OAuth-only user), they can't reset
    if (!user.password) {
      console.log('[PASSWORD RESET] User is OAuth-only:', email);
      return {
        success: true,
        message:
          'If an account exists with this email, a reset link has been sent',
      };
    }

    // Invalidate old tokens
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = this.generateToken();
    const expiresAt = addHours(new Date(), 1); // 1 hour validity

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Log for dev mode
    console.log('[PASSWORD RESET] Send to:', user.email);
    console.log('Reset URL:', resetUrl);

    // Send via BullMQ worker
    try {
      const htmlContent = resetPasswordTemplate({
        userName: user.username,
        resetLink: resetUrl,
      });

      await this.queueService.enqueueEmail(
        user.email!,
        'Reset your password',
        htmlContent,
        'password-reset',
      );
    } catch (error) {
      console.error(
        '[PASSWORD RESET] Failed to queue email:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      // Don't throw - token was created and logged, email delivery is best-effort
    }

    return {
      success: true,
      message:
        'If an account exists with this email, a reset link has been sent',
    };
  }

  async verifyResetToken(token: string) {
    const tokenRow = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRow) {
      throw new BadRequestException('Invalid reset token');
    }

    if (tokenRow.usedAt) {
      throw new BadRequestException('Reset token already used');
    }

    if (isBefore(tokenRow.expiresAt, new Date())) {
      throw new BadRequestException('Reset token expired');
    }

    return tokenRow;
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenRow = await this.verifyResetToken(token);

    // Hash new password (no strength requirements - user's choice)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await this.prisma.user.update({
      where: { id: tokenRow.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: tokenRow.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all sessions (user must re-login)
    await this.prisma.session.updateMany({
      where: { userId: tokenRow.userId },
      data: { isValid: false },
    });

    return { success: true, message: 'Password reset successfully' };
  }
}
