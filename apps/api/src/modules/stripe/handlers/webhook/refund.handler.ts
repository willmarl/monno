import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';
import { getPriceInfo } from '../../../../common/constants/stripe.constants';
import Stripe from 'stripe';

@Injectable()
export class RefundHandler {
  constructor(private prisma: PrismaService) {}

  async handle(event: any, stripe: Stripe): Promise<void> {
    const paymentId = event.data.object.payment_intent;
    const paymentIntentInfo = await stripe.paymentIntents.retrieve(paymentId);
    const metadata = paymentIntentInfo.metadata;
    const priceInfo = getPriceInfo(metadata.priceId);

    Logger.log('============');
    Logger.log(event);
    Logger.log('---------------');
    Logger.log(paymentIntentInfo);
    Logger.log('===========');

    const userToRefund = await this.prisma.user.findUnique({
      where: { id: Number(metadata.userId) },
    });

    if (!userToRefund) {
      throw new InternalServerErrorException('User does not exist on my side');
    }

    // Handle credits refund
    if (priceInfo?.type === 'credits') {
      await this.handleCreditsRefund(userToRefund, priceInfo);
    }

    // Handle product refund
    if (priceInfo?.type === 'product') {
      await this.handleProductRefund(userToRefund, priceInfo);
    }

    // Handle subscription refund (no state change needed)
    if (priceInfo?.type === 'subscription') {
      // Subscription refunds don't change subscription status.
      // Users must explicitly cancel via customer portal.
      // Refund is just a payment reversal.
    }
  }

  private async handleCreditsRefund(
    userToRefund: any,
    priceInfo: any,
  ): Promise<void> {
    const balanceBefore = userToRefund.credits;
    const creditsToSubtract = priceInfo.credits;

    await this.prisma.user.update({
      where: { id: userToRefund.id },
      data: {
        credits: { decrement: creditsToSubtract },
      },
    });

    await this.prisma.creditTransaction.create({
      data: {
        userId: userToRefund.id,
        type: 'REFUND',
        amount: creditsToSubtract,
        balanceBefore: balanceBefore,
        balanceAfter: balanceBefore - creditsToSubtract,
      },
    });
  }

  private async handleProductRefund(
    userToRefund: any,
    priceInfo: any,
  ): Promise<void> {
    await this.prisma.productPurchase.update({
      where: {
        userId_productId: {
          userId: userToRefund.id,
          productId: priceInfo.productId,
        },
      },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });
  }
}
