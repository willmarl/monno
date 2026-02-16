import { Logger } from '@nestjs/common';
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  STRIPE_ONE_TIME_PRICES,
  STRIPE_CREDIT_PRICES,
  STRIPE_SUB_PRICES,
  STRIPE_PRODUCT_ID,
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

    if (!customerId) {
      // Create Stripe customer if doesn't exist
      const stripe = this.getStripeClient();
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;

      // Save to DB
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const validPrices = [
      ...Object.values(STRIPE_ONE_TIME_PRICES),
      ...Object.values(STRIPE_SUB_PRICES),
    ];

    if (!validPrices.includes(data.priceId as any)) {
      throw new BadRequestException('Invalid Price ID');
    }
    // TODO # check if purchase is applicable :
    // make canceling sub endpoint? actually theres customer portal. /create-portal-session
    // handle auto renew sub
    // handle payment fail

    // Check if this is a subscription price
    const isSubscriptionPrice = Object.values(STRIPE_SUB_PRICES).includes(
      data.priceId as any,
    );
    const mode = isSubscriptionPrice ? 'subscription' : 'payment';

    if (isSubscriptionPrice) {
      // check if user buying same tier sub
      const userTier = await this.prisma.subscription.findUnique({
        where: { userId: user.id },
        select: { tier: true },
      });
      if (
        userTier?.tier == 'BASIC' &&
        data.priceId == STRIPE_SUB_PRICES.BASIC
      ) {
        throw new BadRequestException('User already basic tier');
      }
      if (userTier?.tier == 'PRO' && data.priceId == STRIPE_SUB_PRICES.PRO) {
        throw new BadRequestException('User already pro tier');
      }
      // if downgrading/canceling deny. tell to use customer portal endpoint
      // if upgrading to better tier, sub.update (proration_behavior)
    } else {
      // check if user trying to buy product already owned
      if (data.priceId in STRIPE_ONE_TIME_PRICES) {
        // get dict key = x
        // with x look in stripe product ID = y
        // prisma.productPurchase filter by user ID = z
        // if y in z throw error
      }
    }

    const stripe = this.getStripeClient();
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

        // Subscription Logic
        if (event.data.object.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            event.data.object.subscription,
          );
          const subPriceId = sub['plan']['id'];
          // find name that matches price ID
          // update subscription model status and tier
          let newTier: string = 'BASIC';

          if (subPriceId == STRIPE_SUB_PRICES.BASIC) {
            newTier = 'BASIC';
          }
          if (subPriceId == STRIPE_SUB_PRICES.PRO) {
            newTier = 'PRO';
          }

          await this.prisma.subscription.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              status: 'ACTIVE',
              tier: newTier as any,
              periodStart: new Date(
                sub.items.data[0].current_period_end * 1000,
              ),
              periodEnd: new Date(sub.items.data[0].current_period_end * 1000),
            },
            update: {
              status: 'ACTIVE',
              tier: newTier as any,
              periodStart: new Date(
                sub.items.data[0].current_period_end * 1000,
              ),
              periodEnd: new Date(sub.items.data[0].current_period_end * 1000),
            },
          });
        } else {
          // One-Time payment group

          const item = await stripe.checkout.sessions.listLineItems(
            event.data.object.id,
          );

          const productId = item.data[0].price?.product;
          // if product ID in course/one time purchases
          // add to DB productId
          // I may want to change this to be actual product name instead of ID
          if (
            productId == STRIPE_PRODUCT_ID.COURSE_A ||
            productId == STRIPE_PRODUCT_ID.COURSE_B
          ) {
            await this.prisma.productPurchase.create({
              data: {
                userId: user.id,
                productId: productId,
              },
            });
          }
          // if product ID in credits
          // I need better constant model for credits
          if (productId == STRIPE_PRODUCT_ID.CREDITS) {
            const balanceBefore = user.credits;
            let creditsToAdd = 0;
            const priceId = item.data[0].price?.id;

            if (priceId == STRIPE_CREDIT_PRICES.CREDITS_4_99) {
              creditsToAdd = 500;
            }
            if (priceId == STRIPE_CREDIT_PRICES.CREDITS_9_99) {
              creditsToAdd = 1200;
            }
            await this.prisma.creditPurchase.create({
              data: {
                userId: user.id,
                amount: creditsToAdd,
                pricePaid: item.data[0].amount_total,
                currency: item.data[0].price?.currency,
                stripeSessionId: event.data.object.id,
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
