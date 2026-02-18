import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';
import { getPriceInfo } from '../../../../common/constants/stripe.constants';
import Stripe from 'stripe';

@Injectable()
export class InvoicePaymentHandler {
  constructor(private prisma: PrismaService) {}

  async handle(event: any, stripe: Stripe): Promise<void> {
    // Only handle subscription renewal payments
    if (event.data.object.billing_reason !== 'subscription_cycle') {
      return;
    }

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

    await this.prisma.subscription.update({
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
}
