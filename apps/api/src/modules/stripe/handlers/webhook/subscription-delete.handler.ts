import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionDeleteHandler {
  constructor(private prisma: PrismaService) {}

  async handle(event: any, stripe: Stripe): Promise<void> {
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
  }
}
