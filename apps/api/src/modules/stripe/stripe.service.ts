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
      const userTier = await this.prisma.subscription.findUnique({
        where: { userId: user.id },
        select: { tier: true },
      });
      // check if user buying same tier sub
      if (userTier?.tier === priceInfo.name) {
        throw new BadRequestException(`User already ${priceInfo.name} tier`);
      }

      // mayber add check that on stripe's side user is also on basic tier

      // FREE to BASIC || PRO is just normal checkout.
      // If more tiers then put logic here

      // if upgrading to better tier, sub.update (proration_behavior)
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
              price: STRIPE_SUBSCRIPTION_PRICES.PRO.id,
            },
          ],
          proration_behavior: 'create_prorations',
        });

        // 3. Update my DB
        const updatedUser = await this.prisma.subscription.update({
          where: { userId: user.id },
          data: {
            tier: 'PRO',
          },
        });

        return `successfully updated subscription tier from ${userTier.tier} to ${STRIPE_SUBSCRIPTION_PRICES.PRO.tier} for user ${user.username}`;
      }
      // if downgrading from PRO to BASIC
      if (userTier?.tier === 'PRO' && priceInfo.name === 'BASIC') {
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
              price: STRIPE_SUBSCRIPTION_PRICES.BASIC.id,
            },
          ],
          proration_behavior: 'create_prorations',
        });

        // 3. Update my DB
        const updatedUser = await this.prisma.subscription.update({
          where: { userId: user.id },
          data: {
            nextTier: 'BASIC',
          },
        });
        return `successfully downgrade subscription tier from ${userTier.tier} to ${STRIPE_SUBSCRIPTION_PRICES.BASIC.tier} for user ${user.username}`;
      }
      // if canceling deny. tell to use customer portal endpoint
      if (
        userTier?.tier === 'PRO' ||
        (userTier?.tier === 'BASIC' && priceInfo.name === 'FREE')
      ) {
        throw new BadRequestException(
          'Use customer portal. endpoint is /stripe/customer-portal',
        );
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
      success_url: 'https://example.com/success',
      cancel_url: 'http://localhost:3000',
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
      // ============================
      // confirm payment for new subs and one time payments
      // ============================
      case 'checkout.session.completed':
        // set metadata. not needed for confirm payments but will help with refund
        const paymentIntentId = event.data.object.payment_intent;
        const sessionMetadata = event.data.object.metadata;
        const updatedPaymentIntent = await stripe.paymentIntents.update(
          paymentIntentId,
          {
            metadata: {
              userId: sessionMetadata.userId,
              priceId: sessionMetadata.priceId,
            },
          },
        );

        // Get user by stripeCustomerId (more efficient - it's indexed)
        const user = await this.prisma.user.findUnique({
          where: { stripeCustomerId: event.data.object.customer },
        });

        if (!user) {
          Logger.warn('Customer not found:', event.data.object.customer);
          break;
        }

        // -----------------------------
        // Subscription
        // -----------------------------
        if (event.data.object.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            event.data.object.subscription,
          );
          const subPriceId = sub['plan']['id'];
          const priceInfo = getPriceInfo(subPriceId);
          const newTier = priceInfo?.name;
          const validTiers = ['FREE', 'BASIC', 'PRO'];
          if (!newTier || !validTiers.includes(newTier)) {
            throw new InternalServerErrorException('Invalid tier name');
          }

          await this.prisma.subscription.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              stripeId: event.data.object.id,
              status: 'ACTIVE',
              tier: newTier as any,
              periodStart: new Date(
                sub.items.data[0].current_period_start * 1000,
              ),
              periodEnd: new Date(sub.items.data[0].current_period_end * 1000),
            },
            update: {
              status: 'ACTIVE',
              tier: newTier as any,
              periodStart: new Date(
                sub.items.data[0].current_period_start * 1000,
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
            // check if need to create or update
            const usersProduct = await this.prisma.productPurchase.findUnique({
              where: {
                userId_productId: {
                  userId: user.id,
                  productId: priceInfo.productId,
                },
              },
            });

            if (usersProduct) {
              //it exists which means its refunded. update it
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
                },
              });
            } else {
              // first time bought, no refund history. create
              await this.prisma.productPurchase.create({
                data: {
                  userId: user.id,
                  stripeId: event.data.object.id,
                  productId: priceInfo.productId,
                },
              });
            }
          }

          if (priceInfo?.type === 'credits') {
            // Idempotency: check if credits already purchased
            const existingPurchase =
              await this.prisma.creditPurchase.findUnique({
                where: { stripeId: event.data.object.id },
              });

            if (!existingPurchase) {
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
        }
        break;

      // ============================
      // subscription events
      // ============================
      // User cancels or uncancels subscription via customer portal
      case 'customer.subscription.updated':
        const userForUpdate = await this.prisma.user.findUnique({
          where: { stripeCustomerId: event.data.object.customer },
        });
        if (!userForUpdate) {
          throw new InternalServerErrorException(
            'User does not exist on my side but does on stripe',
          );
        }

        // Detect if cancel scheduled
        if (event.data.object.cancel_at) {
          // User canceled - set nextTier='FREE' for end of billing cycle
          await this.prisma.subscription.update({
            where: { userId: userForUpdate.id },
            data: {
              nextTier: 'FREE',
            },
          });
        } else {
          // User UNCANCELED - clear any pending tier change
          // Check if there was a pending change
          const existingSub = await this.prisma.subscription.findUnique({
            where: { userId: userForUpdate.id },
            select: { nextTier: true, tier: true },
          });

          if (existingSub?.nextTier === 'FREE') {
            // They uncanceled - restore the tier by clearing nextTier
            await this.prisma.subscription.update({
              where: { userId: userForUpdate.id },
              data: {
                nextTier: null,
              },
            });
          }
        }
        break;

      // Cancelation fully complete. sets current tier to FREE
      case 'customer.subscription.deleted':
        const userToDelete = await this.prisma.user.findUnique({
          where: { stripeCustomerId: event.data.object.customer },
        });
        if (!userToDelete) {
          throw new InternalServerErrorException(
            'User does not exist on my side but does on stripe',
          );
        }

        await this.prisma.subscription.update({
          where: { userId: userToDelete.id },
          data: {
            status: 'CANCELED',
            tier: 'FREE',
            nextTier: null,
          },
        });

        break;

      // Check if sub is renewed. check by billing_reason
      case 'invoice.payment_succeeded':
        if (event.data.object.billing_reason === 'subscription_cycle') {
          // renew sub by updating my DB period start/end and tier
          const mainInfo = event.data.object.lines.data[0];

          const user = await this.prisma.user.findUnique({
            where: { stripeCustomerId: event.data.object.customer },
          });
          if (!user) {
            throw new InternalServerErrorException(
              'User does not exist on my side but does on stripe',
            );
          }
          const priceId = mainInfo.pricing.price_details.price;
          const priceInfo = getPriceInfo(priceId);
          const sub = await this.prisma.subscription.update({
            where: { userId: user.id },
            data: {
              status: 'ACTIVE',
              tier: priceInfo?.name as any,
              nextTier: null,
              periodStart: new Date(mainInfo.period.start * 1000),
              periodEnd: new Date(mainInfo.period.end * 1000),
              stripeId: event.data.object.id,
            },
          });
        }
        break;

      // Payment failed for subscription renewal or one-time purchase
      case 'payment_intent.payment_failed':
        const userForFailure = await this.prisma.user.findUnique({
          where: { stripeCustomerId: event.data.object.customer },
        });

        if (userForFailure) {
          Logger.warn(
            `Payment failed for user ${userForFailure.id}. Amount: ${event.data.object.amount / 100} ${event.data.object.currency.toUpperCase()}. Reason: ${event.data.object.last_payment_error?.message || 'Unknown'}`,
          );

          // Mark subscription as past_due if this is a subscription payment
          const subscription = await this.prisma.subscription.findUnique({
            where: { userId: userForFailure.id },
          });

          if (subscription && subscription.status === 'ACTIVE') {
            await this.prisma.subscription.update({
              where: { userId: userForFailure.id },
              data: {
                status: 'PAST_DUE',
              },
            });
            Logger.warn(
              `Subscription marked as PAST_DUE for user ${userForFailure.id}`,
            );
          }
        } else {
          Logger.warn(
            `Payment failed for unknown customer ${event.data.object.customer}`,
          );
        }
        break;

      case 'charge.refunded':
        const paymentId = event.data.object.payment_intent;
        const paymentIntentInfo =
          await stripe.paymentIntents.retrieve(paymentId);
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
          throw new InternalServerErrorException(
            'User does not exist on my side',
          );
        }
        // ----------------------
        // credits refund logic
        // ----------------------
        if (priceInfo?.type == 'credits') {
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
        // ----------------------
        // product refund logic
        // ----------------------
        if (priceInfo?.type == 'product') {
          const refundedProduct = await this.prisma.productPurchase.update({
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
        // ----------------------
        // subscription refund logic
        // ----------------------
        if (priceInfo?.type == 'subscription') {
          // Subscription refunds don't change subscription status.
          // Users must explicitly cancel via customer portal.
          // Refund is just a payment reversal.
        }

        break;
      default:
        Logger.log('Unhandled event type');
        // Logger.log('Unhandled event type:', event.type);
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
      return_url: `http://localhost:3000`, // Where to return after
    });

    return { url: portalSession.url };
  }
}
