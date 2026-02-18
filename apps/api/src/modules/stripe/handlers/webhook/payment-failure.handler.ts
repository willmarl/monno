import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentFailureHandler {
  constructor(private prisma: PrismaService) {}

  async handle(event: any, stripe: Stripe): Promise<void> {
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
  }
}
