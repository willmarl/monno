import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../modules/queue/queue.service';
import { LogoService } from '../logo/logo.service';
import { accountStatusChangedEmailTemplate } from '../email-templates/AccountStatusChanged';

export type AccountStatusEmailInput = {
  username: string;
  email: string | null | undefined;
  previousStatus: string;
  newStatus: string;
  reason?: string | null;
  expireAt?: Date | null;
};

/**
 * Sends account status change emails via the existing BullMQ email queue.
 * Skips when there is no email address (unverified is still notified — critical).
 */
@Injectable()
export class AccountStatusEmailService {
  private readonly logger = new Logger(AccountStatusEmailService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly logoService: LogoService,
  ) {}

  async sendIfPossible(input: AccountStatusEmailInput): Promise<void> {
    if (!input.email) {
      this.logger.debug(
        `Skip status email for ${input.username}: no email on file`,
      );
      return;
    }

    if (input.previousStatus === input.newStatus) {
      return;
    }

    try {
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      const html = accountStatusChangedEmailTemplate({
        userName: input.username,
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
        reason: input.reason,
        expireAt: input.expireAt
          ? input.expireAt.toISOString()
          : null,
        supportUrl: frontend,
        logoUrl: this.logoService.getLogoUrl(),
      });

      const subject = this.subjectFor(input.newStatus);
      await this.queueService.enqueueEmail(
        input.email,
        subject,
        html,
        'account-status-changed',
      );
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue status email for ${input.username}: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  private subjectFor(status: string): string {
    switch (status) {
      case 'SUSPENDED':
        return 'Your account has been suspended';
      case 'BANNED':
        return 'Your account has been banned';
      case 'DELETED':
        return 'Your account has been deleted';
      case 'ACTIVE':
        return 'Your account has been restored';
      default:
        return 'Your account status has changed';
    }
  }
}
