import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../modules/queue/queue.service';
import { LogoService } from '../logo/logo.service';
import {
  purchaseReceiptEmailTemplate,
  type PurchaseReceiptKind,
} from '../email-templates/PurchaseReceipt';
import {
  purchaseRefundEmailTemplate,
  type PurchaseRefundKind,
} from '../email-templates/PurchaseRefund';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type StripeReceiptEmailInput = {
  username: string;
  email: string | null | undefined;
  kind: PurchaseReceiptKind;
  itemLabel: string;
  amountCents?: number | null;
  currency?: string | null;
};

export type StripeRefundEmailInput = {
  username: string;
  email: string | null | undefined;
  kind: PurchaseRefundKind;
  itemLabel: string;
};

/**
 * Branded purchase/refund mail via Resend queue — does not rely on Stripe Dashboard emails.
 * Skips when the user has no email on file.
 */
@Injectable()
export class StripePurchaseEmailService {
  private readonly logger = new Logger(StripePurchaseEmailService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly logoService: LogoService,
  ) {}

  async sendReceiptIfPossible(input: StripeReceiptEmailInput): Promise<void> {
    if (!input.email) {
      this.logger.debug(
        `Skip purchase receipt for ${input.username}: no email on file`,
      );
      return;
    }

    try {
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      const { ctaUrl, ctaLabel, subject } = this.receiptCta(input.kind, frontend);
      const html = purchaseReceiptEmailTemplate({
        userName: escapeHtml(input.username),
        kind: input.kind,
        itemLabel: escapeHtml(input.itemLabel),
        amountLabel: this.formatAmount(input.amountCents, input.currency),
        ctaUrl,
        ctaLabel,
        logoUrl: this.logoService.getLogoUrl(),
      });

      await this.queueService.enqueueEmail(
        input.email,
        subject,
        html,
        'stripe-purchase-receipt',
      );
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue purchase receipt for ${input.username}: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  async sendRefundIfPossible(input: StripeRefundEmailInput): Promise<void> {
    if (!input.email) {
      this.logger.debug(
        `Skip refund email for ${input.username}: no email on file`,
      );
      return;
    }

    try {
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      const html = purchaseRefundEmailTemplate({
        userName: escapeHtml(input.username),
        kind: input.kind,
        itemLabel: escapeHtml(input.itemLabel),
        ctaUrl: `${frontend}/settings`,
        logoUrl: this.logoService.getLogoUrl(),
      });

      await this.queueService.enqueueEmail(
        input.email,
        'Your refund has been processed',
        html,
        'stripe-purchase-refund',
      );
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue refund email for ${input.username}: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  private receiptCta(kind: PurchaseReceiptKind, frontend: string) {
    switch (kind) {
      case 'subscription':
        return {
          subject: 'Your subscription is active',
          ctaUrl: `${frontend}/settings`,
          ctaLabel: 'Manage subscription',
        };
      case 'credits':
        return {
          subject: 'Credits added to your account',
          ctaUrl: `${frontend}/settings`,
          ctaLabel: 'View balance',
        };
      default:
        return {
          subject: 'Your purchase is confirmed',
          ctaUrl: `${frontend}/purchases`,
          ctaLabel: 'View purchases',
        };
    }
  }

  private formatAmount(
    amountCents?: number | null,
    currency?: string | null,
  ): string | null {
    if (amountCents == null || !Number.isFinite(amountCents)) return null;
    const cur = (currency || 'usd').toUpperCase();
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: cur,
      }).format(amountCents / 100);
    } catch {
      return `${(amountCents / 100).toFixed(2)} ${cur}`;
    }
  }
}
