import { Logger } from '@nestjs/common';
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  getPriceInfo,
  STRIPE_SUBSCRIPTION_PRICES,
  STRIPE_PRODUCT_PRICES,
  STRIPE_CREDIT_PRICES,
  STRIPE_PRICE_LOOKUP,
  ALL_VALID_PRICE_IDS,
  VALID_SUB_PRICE_IDS,
} from '../../common/constants/stripe.constants';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class StripeService {
  constructor(private prisma: PrismaService) {}

  private getStripeClient(): Stripe {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }
    return new Stripe(apiKey);
  }

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

    // TODO # check if purchase is applicable :
    // make canceling sub endpoint? actually theres customer portal. /create-portal-session
    // handle auto renew sub
    // handle payment fail

    const mode = priceInfo.type === 'subscription' ? 'subscription' : 'payment';

    // ======================================
    // if subscription price logic
    // ======================================
    if (priceInfo.type === 'subscription') {
      const userTier = await this.prisma.subscription.findUnique({
        where: { userId: user.id },
        select: { tier: true },
      });
      // check if user buying same tier sub
      if (userTier?.tier === priceInfo.name) {
        throw new BadRequestException(`User already ${priceInfo.name} tier`);
      }

      // if upgrading to better tier, sub.update (proration_behavior)
      // FREE to BASIC || PRO is just normal checkout.
      // If more tiers then put logic here
      if (userTier?.tier === 'BASIC' && priceInfo.name === 'PRO') {
        // 1. Get their current subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        const subscription = subscriptions.data[0];

        // 2. Update it directly - Stripe charges the card on file
        const updated = await stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: priceInfo.id,
            },
          ],
          proration_behavior: 'create_prorations',
        });

        return `successfully updated subscription for user ${user.id}`;
      }

      // if downgrading/canceling deny. tell to use customer portal endpoint
      if (userTier?.tier === 'PRO' && priceInfo.name === 'BASIC') {
        throw new BadRequestException(
          'Use customer portal. endpoint is /stripe/customer-portal',
        );
      }
    }
    // ======================================
    // if one time price logic
    // ======================================
    if (priceInfo.type === 'product') {
      // check if user trying to buy product already owned
      const usersProducts = await this.prisma.productPurchase.findMany({
        where: { userId: user.id },
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
      success_url: 'https://example.com/success',
      cancel_url: 'http://localhost:3000',
      line_items: [
        {
          price: data.priceId,
          quantity: 1,
        },
      ],
      mode: mode,
    });

    return { url: session.url };
  }

  // MAKE HANDLER FOR EACH PRODUCT/TYPE FOR EACH PRICE
  // remove logs when finish implmenting
  // Update prisma schema to store stripe session ids just in case
  // Extract the logic into something like ./handlers/subscription-created.ts credits-added.ts
  async handleWebhook(event) {
    switch (event.type) {
      case 'checkout.session.completed':
        // Get user by stripeCustomerId (more efficient - it's indexed)
        const user = await this.prisma.user.findUnique({
          where: { stripeCustomerId: event.data.object.customer },
        });

        if (!user) {
          Logger.warn('Customer not found:', event.data.object.customer);
          break;
        }

        const stripe = this.getStripeClient();

        // -----------------------------
        // Subscription
        // -----------------------------
        if (event.data.object.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            event.data.object.subscription,
          );
          const subPriceId = sub['plan']['id'];
          const priceInfo = STRIPE_PRICE_LOOKUP[
            subPriceId as keyof typeof STRIPE_PRICE_LOOKUP
          ] as any;
          const newTier = priceInfo?.tier || 'BASIC';

          await this.prisma.subscription.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              stripeId: event.subscription,
              status: 'ACTIVE',
              tier: newTier,
              periodStart: new Date(
                sub.items.data[0].current_period_end * 1000,
              ),
              periodEnd: new Date(sub.items.data[0].current_period_end * 1000),
            },
            update: {
              status: 'ACTIVE',
              tier: newTier,
              periodStart: new Date(
                sub.items.data[0].current_period_end * 1000,
              ),
              periodEnd: new Date(sub.items.data[0].current_period_end * 1000),
            },
          });
        } else {
          // -----------------------------
          // One-Time payment group
          // -----------------------------

          const item = await stripe.checkout.sessions.listLineItems(
            event.data.object.id,
          );

          const priceId = item.data[0].price?.id;
          const priceInfo = STRIPE_PRICE_LOOKUP[
            priceId as keyof typeof STRIPE_PRICE_LOOKUP
          ] as any;

          if (priceInfo?.type === 'product') {
            await this.prisma.productPurchase.create({
              data: {
                userId: user.id,
                stripeId: event.data.object.id,
                productId: priceInfo.productId,
              },
            });
          }

          if (priceInfo?.type === 'credits') {
            const balanceBefore = user.credits;
            const creditsToAdd = priceInfo.credits;
            await this.prisma.creditPurchase.create({
              data: {
                userId: user.id,
                stripeId: event.data.object.id,
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
        // Logger.log('===============');
        // Logger.log('===============');
        // Logger.log('===============');
        // Logger.log(item);

        break;
      default:
        Logger.log('Unhandled event type');
        // Logger.log('Unhandled event type:', event.type);
        break;
    }

    return { received: true };
  }
}
