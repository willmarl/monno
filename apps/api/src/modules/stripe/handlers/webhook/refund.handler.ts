import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';
import { getPriceInfo } from '../../../../common/constants/stripe.constants';
import { StripePurchaseEmailService } from '../../../../common/email/stripe-purchase-email.service';
import Stripe from 'stripe';

@Injectable()
export class RefundHandler {
  private readonly logger = new Logger(RefundHandler.name);

  constructor(
    private prisma: PrismaService,
    private stripePurchaseEmail: StripePurchaseEmailService,
  ) {}

  async handle(event: any, stripe: Stripe): Promise<void> {
    const paymentId =
      typeof event.data.object.payment_intent === 'string'
        ? event.data.object.payment_intent
        : event.data.object.payment_intent?.id;

    if (!paymentId) {
      this.logger.warn('charge.refunded without payment_intent — skipping');
      return;
    }

    const paymentIntentInfo = await stripe.paymentIntents.retrieve(paymentId);
    const metadata = paymentIntentInfo.metadata;
    const priceInfo = getPriceInfo(metadata.priceId);

    if (!priceInfo) {
      this.logger.warn(
        `No priceInfo for priceId=${metadata.priceId} on PI ${paymentId}`,
      );
      return;
    }

    const userToRefund = await this.prisma.user.findUnique({
      where: { id: Number(metadata.userId) },
    });

    if (!userToRefund) {
      throw new InternalServerErrorException('User does not exist on my side');
    }

    if (priceInfo.type === 'credits') {
      await this.handleCreditsRefund(userToRefund, priceInfo, paymentId);
    }

    if (priceInfo.type === 'product') {
      await this.handleProductRefund(userToRefund, priceInfo);
    }

    if (priceInfo.type === 'subscription') {
      return;
    }
  }

  /**
   * Shared apply path for webhook + admin-initiated refunds.
   * Idempotent: safe if Stripe webhook arrives after admin already applied.
   */
  async applyCreditsRefund(
    userId: number,
    creditsToSubtract: number,
    paymentIntentId: string,
    reason?: string,
  ): Promise<{ applied: boolean }> {
    const existing = await this.prisma.creditTransaction.findFirst({
      where: {
        userId,
        type: 'REFUND',
        stripeId: paymentIntentId,
      },
    });
    if (existing) {
      return { applied: false };
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new InternalServerErrorException('User does not exist on my side');
    }

    const balanceBefore = user.credits;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: creditsToSubtract } },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          type: 'REFUND',
          amount: creditsToSubtract,
          reason: reason ?? 'stripe_refund',
          balanceBefore,
          balanceAfter: balanceBefore - creditsToSubtract,
          stripeId: paymentIntentId,
        },
      }),
    ]);

    await this.stripePurchaseEmail.sendRefundIfPossible({
      username: user.username,
      email: user.email,
      kind: 'credits',
      itemLabel: `${creditsToSubtract} credits`,
    });

    return { applied: true };
  }

  async applyProductRefund(
    userId: number,
    productId: string,
  ): Promise<{ applied: boolean }> {
    const purchase = await this.prisma.productPurchase.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!purchase) {
      throw new InternalServerErrorException('Product purchase not found');
    }

    if (purchase.status === 'REFUNDED') {
      return { applied: false };
    }

    await this.prisma.productPurchase.update({
      where: { userId_productId: { userId, productId } },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.stripePurchaseEmail.sendRefundIfPossible({
        username: user.username,
        email: user.email,
        kind: 'product',
        itemLabel: productId,
      });
    }

    return { applied: true };
  }

  private async handleCreditsRefund(
    userToRefund: { id: number },
    priceInfo: { credits: number },
    paymentIntentId: string,
  ): Promise<void> {
    await this.applyCreditsRefund(
      userToRefund.id,
      priceInfo.credits,
      paymentIntentId,
    );
  }

  private async handleProductRefund(
    userToRefund: { id: number },
    priceInfo: { productId: string },
  ): Promise<void> {
    await this.applyProductRefund(userToRefund.id, priceInfo.productId);
  }
}
