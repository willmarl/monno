import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { randomBytes } from 'crypto';
import { QueueService } from '../queue/queue.service';
import { verifyEmailTemplate } from '../../common/email-templates/VerifyEmail.js';

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
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  private generateToken() {
    return randomBytes(32).toString('hex'); // long, unguessable
  }

  async sendVerificationEmail(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');
    if (!user.email) throw new BadRequestException('User has no email set');
    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Invalidate old tokens
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });

    const token = this.generateToken();
    const expiresAt = addHours(new Date(), 24); // 24 hours validity

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`; // Points to the unified verification page

    // Log for dev mode (you can grab link manually)
    console.log('[EMAIL VERIFICATION] Send to:', user.email);
    console.log('Verification URL:', verifyUrl);

    // Send via BullMQ worker
    try {
      const htmlContent = verifyEmailTemplate({
        userName: user.username,
        verificationLink: verifyUrl,
      });

      await this.queueService.enqueueEmail(
        user.email,
        'Verify your email address',
        htmlContent,
        'verify',
      );
    } catch (error) {
      console.error(
        '[EMAIL VERIFICATION] Failed to queue email:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      // Don't throw - token was created and logged, email delivery is best-effort
    }

    return user;
  }

  async verifyEmailToken(token: string) {
    const tokenRow = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRow) {
      throw new BadRequestException('Invalid token');
    }

    // If token already used but user is already verified, that's actually success
    if (tokenRow.usedAt && tokenRow.user.isEmailVerified) {
      return tokenRow.user; // Token was already used successfully
    }

    if (tokenRow.usedAt) {
      throw new BadRequestException('Token already used');
    }

    if (isBefore(tokenRow.expiresAt, new Date())) {
      throw new BadRequestException('Token expired');
    }

    // SECURITY: Verify that the email on the token matches current user's email
    // This prevents old tokens from being used if user changed their email
    const currentUser = await this.prisma.user.findUnique({
      where: { id: tokenRow.userId },
    });

    if (
      !currentUser ||
      !currentUser.email ||
      currentUser.email !== tokenRow.user.email
    ) {
      throw new BadRequestException(
        'Token is no longer valid for this email address',
      );
    }

    // Email claiming logic: Check if another user already verified this email
    const otherVerified = await this.prisma.user.findFirst({
      where: {
        email: tokenRow.user.email,
        isEmailVerified: true,
        id: { not: tokenRow.user.id }, // Different user
      },
    });

    if (otherVerified) {
      throw new BadRequestException(
        'Email is already verified by another user',
      );
    }

    // If another unverified user has this email, remove it from them
    // (current user wins by being first to verify)
    const otherUnverified = await this.prisma.user.findFirst({
      where: {
        email: tokenRow.user.email,
        id: { not: tokenRow.user.id }, // Different user
        isEmailVerified: false, // Still unverified
      },
    });

    if (otherUnverified) {
      // Remove email from the other account (they didn't verify first)
      console.log(
        `[EMAIL VERIFICATION] Claiming email from user ${otherUnverified.id}`,
      );
      await this.prisma.user.update({
        where: { id: otherUnverified.id },
        data: { email: null },
      });
    }

    // Mark this user's email as verified
    await this.prisma.user.update({
      where: { id: tokenRow.userId },
      data: {
        emailVerifiedAt: new Date(),
        isEmailVerified: true,
      },
    });

    // Mark token as used
    await this.prisma.emailVerificationToken.update({
      where: { id: tokenRow.id },
      data: { usedAt: new Date() },
    });

    return tokenRow.user;
  }
}
