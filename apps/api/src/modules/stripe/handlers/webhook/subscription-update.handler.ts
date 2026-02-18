import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionUpdateHandler {
  constructor(private prisma: PrismaService) {}

  async handle(event: any, stripe: Stripe): Promise<void> {
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
  }
}
