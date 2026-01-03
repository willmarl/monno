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

    // Use tempEmail if it exists (email change case), otherwise use primary email
    const emailToVerify = user.tempEmail || user.email;
    if (!emailToVerify) throw new BadRequestException('User has no email set');

    // If user has tempEmail, they're changing their email - allow verification
    // If user has no tempEmail and email is already verified, deny
    if (!user.tempEmail && user.isEmailVerified) {
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

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`; // Points to the unified verification page

    // Log for dev mode (you can grab link manually)
    console.log('[EMAIL VERIFICATION] Send to:', emailToVerify);
    console.log('Verification URL:', verifyUrl);

    // Send via BullMQ worker
    try {
      const htmlContent = verifyEmailTemplate({
        userName: user.username,
        verificationLink: verifyUrl,
      });

      await this.queueService.enqueueEmail(
        emailToVerify,
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

    const currentUser = await this.prisma.user.findUnique({
      where: { id: tokenRow.userId },
    });

    if (!currentUser) {
      throw new BadRequestException('User not found');
    }

    // Determine which email is being verified (tempEmail if changing email, otherwise primary email)
    const emailBeingVerified = currentUser.tempEmail || currentUser.email;

    if (!emailBeingVerified) {
      throw new BadRequestException('No email to verify');
    }

    // Check if another user already verified this email
    const otherVerified = await this.prisma.user.findFirst({
      where: {
        email: emailBeingVerified,
        isEmailVerified: true,
        id: { not: currentUser.id }, // Different user
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
        OR: [
          {
            email: emailBeingVerified,
            id: { not: currentUser.id },
            isEmailVerified: false,
          },
          {
            tempEmail: emailBeingVerified,
            id: { not: currentUser.id },
          },
        ],
      },
    });

    if (otherUnverified) {
      console.log(
        `[EMAIL VERIFICATION] Claiming email from user ${otherUnverified.id}`,
      );
      await this.prisma.user.update({
        where: { id: otherUnverified.id },
        data: {
          email: null,
          tempEmail: null, // Clear tempEmail too if they had one pending
        },
      });
    }

    // Update the user with verified email
    // If tempEmail exists, move it to email and clear tempEmail
    // Otherwise, just mark primary email as verified
    const updateData = currentUser.tempEmail
      ? {
          email: currentUser.tempEmail,
          tempEmail: null,
          emailVerifiedAt: new Date(),
          isEmailVerified: true,
        }
      : {
          emailVerifiedAt: new Date(),
          isEmailVerified: true,
        };

    await this.prisma.user.update({
      where: { id: tokenRow.userId },
      data: updateData,
    });

    // Mark token as used
    await this.prisma.emailVerificationToken.update({
      where: { id: tokenRow.id },
      data: { usedAt: new Date() },
    });

    return tokenRow.user;
  }
}
