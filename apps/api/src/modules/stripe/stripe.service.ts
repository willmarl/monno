import { Logger } from '@nestjs/common';
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  getPriceInfo,
  STRIPE_SUBSCRIPTION_PRICES,
  STRIPE_CREDIT_PRICES,
  ALL_VALID_PRICE_IDS,
  TierName,
  isUpgrade,
  isDowngrade,
} from '../../common/constants/stripe.constants';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutSessionHandler } from './handlers/webhook/checkout-session.handler';
import { SubscriptionUpdateHandler } from './handlers/webhook/subscription-update.handler';
import { SubscriptionDeleteHandler } from './handlers/webhook/subscription-delete.handler';
import { InvoicePaymentHandler } from './handlers/webhook/invoice-payment.handler';
import { PaymentFailureHandler } from './handlers/webhook/payment-failure.handler';
import { RefundHandler } from './handlers/webhook/refund.handler';

@Injectable()
export class StripeService {
  constructor(
    private prisma: PrismaService,
    private checkoutSessionHandler: CheckoutSessionHandler,
    private subscriptionUpdateHandler: SubscriptionUpdateHandler,
    private subscriptionDeleteHandler: SubscriptionDeleteHandler,
    private invoicePaymentHandler: InvoicePaymentHandler,
    private paymentFailureHandler: PaymentFailureHandler,
    private refundHandler: RefundHandler,
  ) {}

  private getStripeClient(): Stripe {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }
    return new Stripe(apiKey);
  }

  // Todo for all funcs in this file. toggle option to send email

  async createCheckoutSession(userId: number, data: CreateCheckoutSessionDto) {
    // Get or create Stripe customer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.email || !user.isEmailVerified) {
      throw new BadRequestException('Verified email is required');
    }

    let customerId = user.stripeCustomerId;

    const stripe = this.getStripeClient();

    if (!customerId) {
      // Create Stripe customer if doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    if (!ALL_VALID_PRICE_IDS.includes(data.priceId as any)) {
      throw new BadRequestException('Invalid Price ID');
    }

    // Get price info with id, name, and category
    const priceInfo = getPriceInfo(data.priceId);
    if (!priceInfo) {
      throw new BadRequestException('Price not found');
      // This shouldnt happen because of valid price ID check but just in case
    }

    const mode = priceInfo.type === 'subscription' ? 'subscription' : 'payment';

    // ======================================
    // if subscription price logic
    // ======================================
    const userTier = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { tier: true },
    });
    if (userTier && priceInfo.type === 'subscription') {
      const currentTier = userTier.tier as TierName;
      const newTier = priceInfo.name as TierName;

      // Check if user already on this tier
      if (currentTier === newTier) {
        throw new BadRequestException(`User already on ${newTier} tier`);
      }

      // Get price from constants
      const newPrice =
        STRIPE_SUBSCRIPTION_PRICES[
          newTier as keyof typeof STRIPE_SUBSCRIPTION_PRICES
        ];

      if (!newPrice) {
        throw new BadRequestException(`Price not found for tier: ${newTier}`);
      }

      // ===============================
      // UPGRADE: To a higher tier
      // ===============================
      if (isUpgrade(currentTier, newTier)) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        const subscription = subscriptions.data[0];

        // Update subscription on Stripe (proration charges immediately)
        await stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPrice.id,
            },
          ],
          proration_behavior: 'create_prorations',
        });

        // Update database
        await this.prisma.subscription.update({
          where: { userId: user.id },
          data: {
            tier: newTier,
          },
        });

        return `Successfully upgraded from ${currentTier} to ${newTier} for user ${user.username}`;
      }

      // ===============================
      // DOWNGRADE: To a lower tier
      // ===============================
      if (isDowngrade(currentTier, newTier)) {
        // Prevent downgrade to FREE - use customer portal instead
        if (newTier === 'FREE') {
          throw new BadRequestException(
            'To cancel subscription, use customer portal at /stripe/customer-portal',
          );
        }

        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        const subscription = subscriptions.data[0];

        // Update subscription on Stripe
        await stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPrice.id,
            },
          ],
          proration_behavior: 'create_prorations',
        });

        // Downgrade takes effect at the end of current billing period
        await this.prisma.subscription.update({
          where: { userId: user.id },
          data: {
            nextTier: newTier,
          },
        });

        return `Successfully scheduled downgrade from ${currentTier} to ${newTier} for user ${user.username}`;
      }
    }
    // ======================================
    // if one time price logic
    // ======================================
    if (priceInfo.type === 'product') {
      // check if user trying to buy product already owned (only ACTIVE purchases)
      const usersProducts = await this.prisma.productPurchase.findMany({
        where: {
          userId: user.id,
          status: 'ACTIVE',
        },
      });
      const alreadyOwned = usersProducts.some(
        (p) => p.productId === priceInfo.productId,
      );
      if (alreadyOwned) {
        throw new BadRequestException(`User already owns ${priceInfo.name}`);
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      success_url: `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      line_items: [
        {
          price: data.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        priceId: priceInfo.id,
      },
      mode: mode,
    });

    // return session;
    return { url: session.url };
  }

  async handleWebhook(event) {
    const stripe = this.getStripeClient();

    switch (event.type) {
      case 'checkout.session.completed':
        await this.checkoutSessionHandler.handle(event, stripe);
        break;

      case 'customer.subscription.updated':
        await this.subscriptionUpdateHandler.handle(event, stripe);
        break;

      case 'customer.subscription.deleted':
        await this.subscriptionDeleteHandler.handle(event, stripe);
        break;

      case 'invoice.payment_succeeded':
        await this.invoicePaymentHandler.handle(event, stripe);
        break;

      case 'payment_intent.payment_failed':
        await this.paymentFailureHandler.handle(event, stripe);
        break;

      case 'charge.refunded':
        await this.refundHandler.handle(event, stripe);
        break;

      default:
        Logger.log('Unhandled event type:', event.type);
        break;
    }

    return { received: true };
  }

  async createCustomerPortal(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const stripe = this.getStripeClient();
    if (!user?.stripeCustomerId) {
      throw new BadRequestException('User is not stripe customer');
    }
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/settings`, // Where to return after
    });

    return { url: portalSession.url };
  }

  async getUserSubscription(userId: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        tier: true,
        nextTier: true,
        periodStart: true,
        periodEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('User has no subscription');
    }

    return subscription;
  }

  async getUserAllProducts(userId: number) {
    const purchases = await this.prisma.productPurchase.findMany({
      where: { userId },
      select: {
        id: true,
        productId: true,
        status: true,
        purchasedAt: true,
        refundedAt: true,
      },
      orderBy: { purchasedAt: 'desc' },
    });

    return purchases;
  }

  async getUserOwnedProducts(userId: number) {
    const purchases = await this.prisma.productPurchase.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        productId: true,
        status: true,
        purchasedAt: true,
        refundedAt: true,
      },
      orderBy: { purchasedAt: 'desc' },
    });

    return purchases;
  }

  async getUserCreditPurchases(userId: number) {
    const purchases = await this.prisma.creditPurchase.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        pricePaid: true,
        currency: true,
        purchasedAt: true,
      },
      orderBy: { purchasedAt: 'desc' },
    });

    return purchases;
  }

  async getUserCreditTransactions(userId: number) {
    const transactions = await this.prisma.creditTransaction.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        amount: true,
        reason: true,
        balanceBefore: true,
        balanceAfter: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions;
  }
}
