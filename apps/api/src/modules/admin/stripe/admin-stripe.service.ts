import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { AdminService } from '../admin.service';
import { SubscriptionSearchDto } from '../../stripe/dto/search-subscription.dto';
import { ProductSearchDto } from '../../stripe/dto/search-product.dto';
import { CreditPurchaseSearchDto } from '../../stripe/dto/search-credit-purchase.dto';
import { CreditTransactionSearchDto } from '../../stripe/dto/search-credit-transaction.dto';
import { RefundHandler } from '../../stripe/handlers/webhook/refund.handler';
import Stripe from 'stripe';

const DEFAULT_SUBSCRIPTION_SELECT = {
  id: true,
  status: true,
  tier: true,
  nextTier: true,
  periodStart: true,
  periodEnd: true,
  createdAt: true,
  updatedAt: true,
  stripeId: true,
  user: {
    select: { id: true, username: true, avatarPath: true },
  },
};

const DEFAULT_PRODUCTS_SELECT = {
  id: true,
  productId: true,
  status: true,
  purchasedAt: true,
  refundedAt: true,
  stripeId: true,
  user: {
    select: { id: true, username: true, avatarPath: true },
  },
};

const DEFAULT_CREDITS_TRANSACTIONS_SELECT = {
  id: true,
  type: true,
  amount: true,
  reason: true,
  balanceBefore: true,
  balanceAfter: true,
  createdAt: true,
  user: {
    select: { id: true, username: true, avatarPath: true },
  },
};

const DEFAULT_CREDITS_PURCHASES_SELECT = {
  id: true,
  amount: true,
  currency: true,
  pricePaid: true,
  purchasedAt: true,
  stripeId: true,
  user: {
    select: {
      id: true,
      username: true,
      avatarPath: true,
      stripeCustomerId: true,
    },
  },
};

@Injectable()
export class AdminStripeService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
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

  async getSubscriptions(searchDto: SubscriptionSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const filterConditions: any[] = [];

    if (searchDto.status) {
      filterConditions.push({ status: searchDto.status });
    }

    if (searchDto.tier) {
      filterConditions.push({ tier: searchDto.tier });
    }

    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.subscription,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_SUBSCRIPTION_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async getProducts(searchDto: ProductSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const filterConditions: any[] = [];

    if (searchDto.status) {
      filterConditions.push({ status: searchDto.status });
    }

    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.productPurchase,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_PRODUCTS_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async getCreditPurchases(searchDto: CreditPurchaseSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.creditPurchase,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where: where,
        orderBy,
        select: DEFAULT_CREDITS_PURCHASES_SELECT,
      },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async getCreditTransactions(searchDto: CreditTransactionSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const filterConditions: any[] = [];

    if (searchDto.type) {
      filterConditions.push({ type: searchDto.type });
    }

    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.creditTransaction,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_CREDITS_TRANSACTIONS_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  /**
   * Full refund of a one-time product purchase via Stripe.
   * Local DB update is applied immediately; webhook is idempotent.
   */
  async refundProductPurchase(purchaseId: number, adminId: number) {
    const purchase = await this.prisma.productPurchase.findUnique({
      where: { id: purchaseId },
      include: { user: { select: { id: true, username: true } } },
    });

    if (!purchase) {
      throw new NotFoundException('Product purchase not found');
    }
    if (purchase.status === 'REFUNDED') {
      throw new BadRequestException('Purchase is already refunded');
    }

    const stripe = this.getStripeClient();
    const paymentIntentId = await this.paymentIntentFromCheckoutSession(
      stripe,
      purchase.stripeId,
    );

    const refund = await this.createRefund(stripe, paymentIntentId);
    await this.refundHandler.applyProductRefund(
      purchase.userId,
      purchase.productId,
    );

    await this.adminService.log({
      adminId,
      action: 'STRIPE_PRODUCT_REFUNDED',
      resource: 'STRIPE',
      targetId: purchase.id,
      description: `Refunded product ${purchase.productId} for user ${purchase.user.username}`,
      changes: {
        purchaseId: purchase.id,
        productId: purchase.productId,
        userId: purchase.userId,
        paymentIntentId,
        refundId: refund.id,
      },
    });

    return {
      refunded: true,
      refundId: refund.id,
      purchaseId: purchase.id,
    };
  }

  /**
   * Full refund of a credit pack purchase. Resolves payment intent by matching
   * the stored checkout line-item id under the customer's sessions.
   */
  async refundCreditPurchase(purchaseId: number, adminId: number) {
    const purchase = await this.prisma.creditPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            stripeCustomerId: true,
            credits: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Credit purchase not found');
    }

    const stripe = this.getStripeClient();
    const paymentIntentId = await this.paymentIntentFromCreditLineItem(
      stripe,
      purchase.user.stripeCustomerId,
      purchase.stripeId,
    );

    const already = await this.prisma.creditTransaction.findFirst({
      where: {
        userId: purchase.userId,
        type: 'REFUND',
        stripeId: paymentIntentId,
      },
    });
    if (already) {
      throw new BadRequestException('Purchase is already refunded');
    }

    if (purchase.user.credits < purchase.amount) {
      throw new BadRequestException(
        `User only has ${purchase.user.credits} credits; purchase was ${purchase.amount}. Refund aborted.`,
      );
    }

    const refund = await this.createRefund(stripe, paymentIntentId);
    await this.refundHandler.applyCreditsRefund(
      purchase.userId,
      purchase.amount,
      paymentIntentId,
      `admin_refund_credit_purchase_${purchase.id}`,
    );

    await this.adminService.log({
      adminId,
      action: 'STRIPE_CREDIT_REFUNDED',
      resource: 'STRIPE',
      targetId: purchase.id,
      description: `Refunded ${purchase.amount} credits for user ${purchase.user.username}`,
      changes: {
        purchaseId: purchase.id,
        userId: purchase.userId,
        amount: purchase.amount,
        paymentIntentId,
        refundId: refund.id,
      },
    });

    return {
      refunded: true,
      refundId: refund.id,
      purchaseId: purchase.id,
      creditsRemoved: purchase.amount,
    };
  }

  private async createRefund(stripe: Stripe, paymentIntentId: string) {
    try {
      return await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
    } catch (err: any) {
      const message =
        err?.raw?.message || err?.message || 'Stripe refund failed';
      throw new BadRequestException(message);
    }
  }

  private async paymentIntentFromCheckoutSession(
    stripe: Stripe,
    sessionId: string,
  ): Promise<string> {
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      throw new BadRequestException(
        'Could not load Stripe checkout session for this purchase',
      );
    }

    const pi = session.payment_intent;
    if (!pi) {
      throw new BadRequestException(
        'Checkout session has no payment intent (cannot refund)',
      );
    }
    return typeof pi === 'string' ? pi : pi.id;
  }

  private async paymentIntentFromCreditLineItem(
    stripe: Stripe,
    stripeCustomerId: string | null,
    lineItemId: string,
  ): Promise<string> {
    if (!stripeCustomerId) {
      throw new BadRequestException('User has no Stripe customer id');
    }

    let startingAfter: string | undefined;
    for (let page = 0; page < 5; page++) {
      const sessions = await stripe.checkout.sessions.list({
        customer: stripeCustomerId,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      for (const session of sessions.data) {
        if (session.mode !== 'payment' || !session.payment_intent) continue;

        const items = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 20,
        });
        if (items.data.some((li) => li.id === lineItemId)) {
          const pi = session.payment_intent;
          return typeof pi === 'string' ? pi : pi.id;
        }
      }

      if (!sessions.has_more || sessions.data.length === 0) break;
      startingAfter = sessions.data[sessions.data.length - 1].id;
    }

    throw new NotFoundException(
      'Could not find Stripe payment for this credit purchase',
    );
  }

  /**
   * Admin dashboard: Stripe account balance + recent local purchases.
   * Balance is live from Stripe; purchases come from our DB (fast, app-accurate).
   */
  async getDashboardOverview(recentLimit = 8) {
    const configured = !!process.env.STRIPE_SECRET_KEY;
    if (!configured) {
      return {
        configured: false as const,
        mode: null,
        balance: null,
        recent: [],
        dashboardUrl: null,
      };
    }

    const mode = process.env.STRIPE_SECRET_KEY!.startsWith('sk_live')
      ? ('live' as const)
      : ('test' as const);
    const dashboardUrl =
      mode === 'live'
        ? 'https://dashboard.stripe.com/balance'
        : 'https://dashboard.stripe.com/test/balance';

    const take = Math.min(Math.max(recentLimit, 1), 20);
    const stripe = this.getStripeClient();

    const [balance, products, credits, subscriptions] = await Promise.all([
      stripe.balance.retrieve().catch(() => null),
      this.prisma.productPurchase.findMany({
        take,
        orderBy: { purchasedAt: 'desc' },
        select: {
          id: true,
          productId: true,
          status: true,
          purchasedAt: true,
          user: { select: { id: true, username: true } },
        },
      }),
      this.prisma.creditPurchase.findMany({
        take,
        orderBy: { purchasedAt: 'desc' },
        select: {
          id: true,
          amount: true,
          pricePaid: true,
          currency: true,
          purchasedAt: true,
          user: { select: { id: true, username: true } },
        },
      }),
      this.prisma.subscription.findMany({
        take,
        orderBy: { createdAt: 'desc' },
        where: { tier: { not: 'FREE' } },
        select: {
          id: true,
          tier: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, username: true } },
        },
      }),
    ]);

    const recent = [
      ...products.map((p) => ({
        kind: 'product' as const,
        id: p.id,
        label: p.productId,
        status: p.status,
        username: p.user.username,
        userId: p.user.id,
        amountCents: null as number | null,
        currency: null as string | null,
        at: p.purchasedAt,
      })),
      ...credits.map((c) => ({
        kind: 'credits' as const,
        id: c.id,
        label: `${c.amount} credits`,
        status: 'PURCHASED',
        username: c.user.username,
        userId: c.user.id,
        amountCents: c.pricePaid,
        currency: c.currency,
        at: c.purchasedAt,
      })),
      ...subscriptions.map((s) => ({
        kind: 'subscription' as const,
        id: s.id,
        label: `${s.tier} plan`,
        status: s.status,
        username: s.user.username,
        userId: s.user.id,
        amountCents: null as number | null,
        currency: null as string | null,
        at: s.createdAt,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, take);

    return {
      configured: true as const,
      mode,
      dashboardUrl,
      balance: balance
        ? {
            available: balance.available.map((b) => ({
              amount: b.amount,
              currency: b.currency,
            })),
            pending: balance.pending.map((b) => ({
              amount: b.amount,
              currency: b.currency,
            })),
          }
        : null,
      recent,
    };
  }

  /**
   * Cancel a subscription at period end or immediately.
   * Local DB is updated right away; Stripe webhooks are complementary.
   */
  async cancelSubscription(
    subscriptionId: number,
    adminId: number,
    mode: 'period_end' | 'immediate',
  ) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    if (sub.status === 'CANCELED' && sub.tier === 'FREE') {
      throw new BadRequestException('Subscription is already canceled');
    }

    const stripe = this.getStripeClient();
    const stripeSubId = await this.resolveStripeSubscriptionId(stripe, sub);

    if (mode === 'period_end') {
      try {
        await stripe.subscriptions.update(stripeSubId, {
          cancel_at_period_end: true,
        });
      } catch (err: any) {
        throw new BadRequestException(
          err?.raw?.message || err?.message || 'Stripe cancel failed',
        );
      }

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { nextTier: 'FREE' },
      });

      await this.adminService.log({
        adminId,
        action: 'STRIPE_SUBSCRIPTION_CANCEL_AT_PERIOD_END',
        resource: 'STRIPE',
        targetId: sub.id,
        description: `Scheduled cancel for ${sub.user.username} (${sub.tier}) at period end`,
        changes: {
          subscriptionId: sub.id,
          userId: sub.userId,
          stripeSubscriptionId: stripeSubId,
          mode,
        },
      });

      return {
        canceled: true,
        mode,
        subscriptionId: sub.id,
        stripeSubscriptionId: stripeSubId,
      };
    }

    try {
      await stripe.subscriptions.cancel(stripeSubId);
    } catch (err: any) {
      throw new BadRequestException(
        err?.raw?.message || err?.message || 'Stripe cancel failed',
      );
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'CANCELED',
        tier: 'FREE',
        nextTier: null,
      },
    });

    await this.adminService.log({
      adminId,
      action: 'STRIPE_SUBSCRIPTION_CANCELED',
      resource: 'STRIPE',
      targetId: sub.id,
      description: `Immediately canceled subscription for ${sub.user.username}`,
      changes: {
        subscriptionId: sub.id,
        userId: sub.userId,
        stripeSubscriptionId: stripeSubId,
        mode,
      },
    });

    return {
      canceled: true,
      mode,
      subscriptionId: sub.id,
      stripeSubscriptionId: stripeSubId,
    };
  }

  /** Recent invoices for the subscription's Stripe customer. */
  async listSubscriptionInvoices(subscriptionId: number, limit = 10) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: { select: { stripeCustomerId: true, username: true } },
      },
    });

    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    if (!sub.user.stripeCustomerId) {
      throw new BadRequestException('User has no Stripe customer id');
    }

    const stripe = this.getStripeClient();
    const invoices = await stripe.invoices.list({
      customer: sub.user.stripeCustomerId,
      limit: Math.min(Math.max(limit, 1), 25),
    });

    return {
      subscriptionId: sub.id,
      username: sub.user.username,
      items: invoices.data.map((inv) => this.mapInvoice(inv)),
    };
  }

  async sendInvoice(invoiceId: string, adminId: number) {
    const stripe = this.getStripeClient();
    let invoice: Stripe.Invoice;
    try {
      invoice = await stripe.invoices.retrieve(invoiceId);
    } catch {
      throw new NotFoundException('Invoice not found on Stripe');
    }

    if (invoice.status !== 'draft') {
      throw new BadRequestException(
        `Only draft invoices can be sent (status=${invoice.status})`,
      );
    }

    try {
      invoice = await stripe.invoices.sendInvoice(invoiceId);
    } catch (err: any) {
      throw new BadRequestException(
        err?.raw?.message || err?.message || 'Send invoice failed',
      );
    }

    await this.adminService.log({
      adminId,
      action: 'STRIPE_INVOICE_SENT',
      resource: 'STRIPE',
      resourceId: invoiceId,
      description: `Sent Stripe invoice ${invoiceId}`,
      changes: { invoiceId, status: invoice.status },
    });

    return { sent: true, invoice: this.mapInvoice(invoice) };
  }

  async voidInvoice(invoiceId: string, adminId: number) {
    const stripe = this.getStripeClient();
    let invoice: Stripe.Invoice;
    try {
      invoice = await stripe.invoices.retrieve(invoiceId);
    } catch {
      throw new NotFoundException('Invoice not found on Stripe');
    }

    if (invoice.status !== 'open') {
      throw new BadRequestException(
        `Only open invoices can be voided (status=${invoice.status})`,
      );
    }

    try {
      invoice = await stripe.invoices.voidInvoice(invoiceId);
    } catch (err: any) {
      throw new BadRequestException(
        err?.raw?.message || err?.message || 'Void invoice failed',
      );
    }

    await this.adminService.log({
      adminId,
      action: 'STRIPE_INVOICE_VOIDED',
      resource: 'STRIPE',
      resourceId: invoiceId,
      description: `Voided Stripe invoice ${invoiceId}`,
      changes: { invoiceId, status: invoice.status },
    });

    return { voided: true, invoice: this.mapInvoice(invoice) };
  }

  private mapInvoice(inv: Stripe.Invoice) {
    return {
      id: inv.id,
      status: inv.status,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      invoicePdf: inv.invoice_pdf,
      created: inv.created,
      number: inv.number,
    };
  }

  /**
   * Prefer stored sub_ id; if renewals overwrote it with an invoice id,
   * fall back to listing the customer's subscriptions.
   */
  private async resolveStripeSubscriptionId(
    stripe: Stripe,
    sub: {
      stripeId: string;
      user: { stripeCustomerId: string | null };
    },
  ): Promise<string> {
    if (sub.stripeId.startsWith('sub_')) {
      return sub.stripeId;
    }

    if (!sub.user.stripeCustomerId) {
      throw new BadRequestException(
        'Cannot resolve Stripe subscription (no customer id)',
      );
    }

    const listed = await stripe.subscriptions.list({
      customer: sub.user.stripeCustomerId,
      status: 'all',
      limit: 10,
    });

    const candidate =
      listed.data.find(
        (s) =>
          s.status === 'active' ||
          s.status === 'trialing' ||
          s.status === 'past_due',
      ) || listed.data[0];

    if (!candidate) {
      throw new NotFoundException('No Stripe subscription found for customer');
    }

    // Heal local stripeId if we recovered a real subscription id
    await this.prisma.subscription.updateMany({
      where: { stripeId: sub.stripeId },
      data: { stripeId: candidate.id },
    });

    return candidate.id;
  }
}
