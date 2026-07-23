import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { QueueService } from '../../queue/queue.service';
import {
  emailConfig,
  getEmailFooter,
  getEmailHead,
  getEmailHeader,
} from '../../../common/email-templates/emailConfig';
import type { AdminComposeEmailDto } from './dto/admin-compose-email.dto';

const BROADCAST_CAP = 2000;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainBodyToHtml(body: string): string {
  return escapeHtml(body).replace(/\r\n/g, '\n').replace(/\n/g, '<br/>');
}

function wrapAdminMessageHtml(subject: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    ${getEmailHead()}
    <body>
      <div class="container">
        <div class="box">
          ${getEmailHeader()}
          <h1 class="heading">${escapeHtml(subject)}</h1>
          <p class="paragraph">${bodyHtml}</p>
          <div class="alert-box">
            <p class="alert-text">
              This message was sent by ${emailConfig.appName} staff.
              This address does not accept replies — please use in-app support
              if you need to respond.
            </p>
          </div>
          ${getEmailFooter()}
        </div>
      </div>
    </body>
    </html>
  `;
}

@Injectable()
export class AdminComposeEmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  /**
   * One-way outbound mail: same message queued once per recipient
   * (selected users), or broadcast to ACTIVE users with email. No CC/BCC —
   * each send is a separate job. No inbound/reply handling.
   */
  async compose(dto: AdminComposeEmailDto): Promise<{
    queued: number;
    skipped: number;
    audience: 'user' | 'all';
  }> {
    if (dto.audience === 'all' && dto.confirmBroadcast !== true) {
      throw new BadRequestException(
        'confirmBroadcast must be true to email all users',
      );
    }

    const subject = dto.subject.trim();
    const html = wrapAdminMessageHtml(subject, plainBodyToHtml(dto.body));
    const prefixedSubject = `[${emailConfig.appName}] ${subject}`;

    if (dto.audience === 'user') {
      return this.composeToUsers(dto.userIds ?? [], prefixedSubject, html);
    }

    const recipients = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deleted: false,
        email: { not: null },
      },
      select: { id: true, email: true },
      take: BROADCAST_CAP + 1,
    });

    if (recipients.length > BROADCAST_CAP) {
      throw new BadRequestException(
        `Too many recipients (cap ${BROADCAST_CAP}). Narrow the audience or raise the cap later.`,
      );
    }

    return this.enqueueEach(
      recipients,
      prefixedSubject,
      html,
      'admin-compose-broadcast',
      'all',
    );
  }

  private async composeToUsers(
    userIds: number[],
    subject: string,
    html: string,
  ) {
    if (userIds.length === 0) {
      throw new BadRequestException('Provide at least one userId');
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, username: true },
    });

    const found = new Set(users.map((u) => u.id));
    const missing = userIds.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(
        `User(s) not found: ${missing.slice(0, 10).join(', ')}${
          missing.length > 10 ? '…' : ''
        }`,
      );
    }

    if (!users.some((u) => !!u.email)) {
      throw new BadRequestException(
        'None of the selected users have an email address on file',
      );
    }

    return this.enqueueEach(
      users,
      subject,
      html,
      'admin-compose-user',
      'user',
    );
  }

  private async enqueueEach(
    recipients: { id: number; email: string | null }[],
    subject: string,
    html: string,
    jobName: string,
    audience: 'user' | 'all',
  ) {
    let queued = 0;
    let skipped = 0;

    for (const user of recipients) {
      if (!user.email) {
        skipped += 1;
        continue;
      }
      await this.queue.enqueueEmail(user.email, subject, html, jobName);
      queued += 1;
    }

    return { queued, skipped, audience };
  }
}
