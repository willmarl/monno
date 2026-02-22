import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';
import {
  getPriceInfo,
  STRIPE_PRICE_LOOKUP,
  TIER_HIERARCHY,
  TierName,
} from '../../../../common/constants/stripe.constants';
import Stripe from 'stripe';

@Injectable()
export class CheckoutSessionHandler {
  constructor(private prisma: PrismaService) {}

  async handle(event: any, stripe: Stripe): Promise<void> {
    const subscriptionId = event.data.object.subscription;
    const paymentIntentId = event.data.object.payment_intent;
    const sessionMetadata = event.data.object.metadata;

    // Set metadata on payment intent
    if (paymentIntentId) {
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
          userId: sessionMetadata.userId,
          priceId: sessionMetadata.priceId,
        },
      });
    }

    // Set metadata on subscription
    if (subscriptionId) {
      await stripe.subscriptions.update(subscriptionId, {
        metadata: {
          userId: sessionMetadata.userId,
          priceId: sessionMetadata.priceId,
        },
      });
    }

    // Get user by stripeCustomerId
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: event.data.object.customer },
    });

    if (!user) {
      Logger.warn('Customer not found:', event.data.object.customer);
      return;
    }

    // Handle subscription creation
    if (subscriptionId) {
      await this.handleSubscriptionCreation(
        subscriptionId,
        sessionMetadata,
        stripe,
      );
    } else {
      // Handle one-time payment
      await this.handleOneTimePayment(event, user, stripe);
    }
  }

  private async handleSubscriptionCreation(
    subscriptionId: string,
    metadata: any,
    stripe: Stripe,
  ): Promise<void> {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const priceInfo = getPriceInfo(metadata.priceId);
    const newTier = priceInfo?.name;

    if (!newTier || !TIER_HIERARCHY.includes(newTier as TierName)) {
      throw new InternalServerErrorException('Invalid tier name');
    }

    await this.prisma.subscription.upsert({
      where: { userId: parseInt(metadata.userId) },
      create: {
        userId: parseInt(metadata.userId),
        stripeId: subscriptionId,
        status: 'ACTIVE',
        tier: newTier as any,
        periodStart: new Date(sub.items.data[0].current_period_start * 1000),
        periodEnd: new Date(sub.items.data[0].current_period_end * 1000),
      },
      update: {
        status: 'ACTIVE',
        tier: newTier as any,
        periodStart: new Date(sub.items.data[0].current_period_start * 1000),
        periodEnd: new Date(sub.items.data[0].current_period_end * 1000),
      },
    });
  }

  private async handleOneTimePayment(
    event: any,
    user: any,
    stripe: Stripe,
  ): Promise<void> {
    const item = await stripe.checkout.sessions.listLineItems(
      event.data.object.id,
    );

    const priceId = item.data[0].price?.id;
    const priceInfo = STRIPE_PRICE_LOOKUP[
      priceId as keyof typeof STRIPE_PRICE_LOOKUP
    ] as any;

    if (priceInfo?.type === 'product') {
      await this.handleProductPurchase(user, priceInfo, event);
    } else if (priceInfo?.type === 'credits') {
      await this.handleCreditPurchase(user, priceInfo, item);
    }
  }

  private async handleProductPurchase(
    user: any,
    priceInfo: any,
    event: any,
  ): Promise<void> {
    const usersProduct = await this.prisma.productPurchase.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: priceInfo.productId,
        },
      },
    });

    if (usersProduct) {
      // Re-purchase: reactivate the product
      await this.prisma.productPurchase.update({
        where: {
          userId_productId: {
            userId: user.id,
            productId: priceInfo.productId,
          },
        },
        data: {
          refundedAt: null,
          status: 'ACTIVE',
          paymentMethod: 'MONEY',
        },
      });
    } else {
      // First purchase
      await this.prisma.productPurchase.create({
        data: {
          userId: user.id,
          stripeId: event.data.object.id,
          productId: priceInfo.productId,
          paymentMethod: 'MONEY',
        },
      });
    }
  }

  private async handleCreditPurchase(
    user: any,
    priceInfo: any,
    item: any,
  ): Promise<void> {
    const existingPurchase = await this.prisma.creditPurchase.findUnique({
      where: { stripeId: item.data[0].id },
    });

    if (!existingPurchase) {
      const balanceBefore = user.credits;
      const creditsToAdd = priceInfo.credits;

      await this.prisma.creditPurchase.create({
        data: {
          userId: user.id,
          stripeId: item.data[0].id,
          amount: creditsToAdd,
          pricePaid: item.data[0].amount_total,
          currency: item.data[0].price?.currency,
        },
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          credits: { increment: creditsToAdd },
        },
      });

      await this.prisma.creditTransaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: creditsToAdd,
          balanceBefore: balanceBefore,
          balanceAfter: balanceBefore + creditsToAdd,
        },
      });
    }
  }
}
