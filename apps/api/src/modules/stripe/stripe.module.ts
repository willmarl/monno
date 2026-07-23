import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { PrismaService } from '../../prisma.service';
import { EmailModule } from '../../common/email/email.module';
import { CheckoutSessionHandler } from './handlers/webhook/checkout-session.handler';
import { SubscriptionUpdateHandler } from './handlers/webhook/subscription-update.handler';
import { SubscriptionDeleteHandler } from './handlers/webhook/subscription-delete.handler';
import { InvoicePaymentHandler } from './handlers/webhook/invoice-payment.handler';
import { PaymentFailureHandler } from './handlers/webhook/payment-failure.handler';
import { RefundHandler } from './handlers/webhook/refund.handler';

@Module({
  imports: [EmailModule],
  controllers: [StripeController],
  providers: [
    StripeService,
    PrismaService,
    CheckoutSessionHandler,
    SubscriptionUpdateHandler,
    SubscriptionDeleteHandler,
    InvoicePaymentHandler,
    PaymentFailureHandler,
    RefundHandler,
  ],
  exports: [RefundHandler],
})
export class StripeModule {}
