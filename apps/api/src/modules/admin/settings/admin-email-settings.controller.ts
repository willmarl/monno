import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminService } from '../admin.service';
import { QueueService } from '../../queue/queue.service';
import { PrismaService } from '../../../prisma.service';
import {
  EmailSettingsService,
  UpdateEmailSettingsDto,
} from '../../../common/email/email-settings.service';
import { getEmailBranding } from '../../../common/email/email-branding';
import {
  emailConfig,
  getEmailFooter,
  getEmailHead,
  getEmailHeader,
} from '../../../common/email-templates/emailConfig';
import { AdminComposeEmailDto } from './dto/admin-compose-email.dto';
import { AdminComposeEmailService } from './admin-compose-email.service';

@ApiTags('admin-settings')
@Controller('admin/settings/email')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminEmailSettingsController {
  constructor(
    private readonly emailSettings: EmailSettingsService,
    private readonly composeEmail: AdminComposeEmailService,
    private readonly adminService: AdminService,
    private readonly queue: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'Get company email branding (admin)' })
  @Get()
  get() {
    return this.emailSettings.getSettings();
  }

  @ApiOperation({ summary: 'Update company email branding (admin)' })
  @ApiBody({ type: UpdateEmailSettingsDto })
  @Patch()
  async update(@Body() body: UpdateEmailSettingsDto, @Req() req: any) {
    const adminId = req.user?.sub as number;
    const result = await this.emailSettings.updateSettings(body);
    await this.adminService.log({
      adminId,
      action: 'EMAIL_SETTINGS_UPDATED',
      resource: 'SETTINGS',
      description: `Updated email from ${result.fromName} <${result.fromEmail}>`,
      changes: body as Record<string, unknown>,
    });
    return result;
  }

  @ApiOperation({
    summary:
      'Compose one-way outbound email to selected users or all ACTIVE users with email',
  })
  @ApiBody({ type: AdminComposeEmailDto })
  @Post('compose')
  async compose(@Body() body: AdminComposeEmailDto, @Req() req: any) {
    const adminId = req.user?.sub as number;
    const result = await this.composeEmail.compose(body);

    await this.adminService.log({
      adminId,
      action:
        body.audience === 'all'
          ? 'EMAIL_BROADCAST_QUEUED'
          : 'EMAIL_COMPOSE_QUEUED',
      resource: 'SETTINGS',
      targetId:
        body.audience === 'user' && body.userIds?.length === 1
          ? body.userIds[0]
          : undefined,
      description:
        body.audience === 'all'
          ? `Queued broadcast email to ${result.queued} user(s): ${body.subject}`
          : `Queued email to ${result.queued} user(s): ${body.subject}`,
      changes: {
        audience: body.audience,
        subject: body.subject,
        queued: result.queued,
        skipped: result.skipped,
        userIds: body.userIds,
      },
    });

    return result;
  }

  @ApiOperation({
    summary: 'Enqueue a test email to the current admin (verifies Resend from)',
  })
  @Post('test')
  async sendTest(@Req() req: any) {
    const adminId = req.user?.sub as number;
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { email: true },
    });

    if (!admin?.email) {
      return {
        queued: false,
        message: 'Admin account has no email address',
      };
    }

    const branding = getEmailBranding();
    const html = `
      <!DOCTYPE html>
      <html>
      ${getEmailHead()}
      <body>
        <div class="container">
          <div class="box">
            ${getEmailHeader()}
            <h1 class="heading">Test email</h1>
            <p class="paragraph">
              This is a test from ${branding.fromName}
              (&lt;${branding.fromEmail}&gt;).
            </p>
            <p class="paragraph">
              If you received this, Resend accepted your configured from address.
              Domain DNS (SPF/DKIM) must be verified in the Resend dashboard.
            </p>
            ${getEmailFooter()}
          </div>
        </div>
      </body>
      </html>
    `;

    await this.queue.enqueueEmail(
      admin.email,
      `[${emailConfig.appName}] Test email`,
      html,
      'admin-email-test',
    );

    await this.adminService.log({
      adminId,
      action: 'EMAIL_TEST_SENT',
      resource: 'SETTINGS',
      description: `Queued test email to ${admin.email}`,
    });

    return { queued: true, to: admin.email };
  }
}
