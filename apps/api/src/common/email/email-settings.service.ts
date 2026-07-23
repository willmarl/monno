import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../../prisma.service';
import {
  EMAIL_SETTING_KEYS,
  emailBrandingFromEnv,
  getEmailBranding,
  setEmailBranding,
  type EmailBranding,
} from './email-branding';

export class UpdateEmailSettingsDto {
  @ApiPropertyOptional({ example: 'Acme' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  fromName?: string;

  @ApiPropertyOptional({ example: 'noreply@acme.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  fromEmail?: string;

  @ApiPropertyOptional({ example: 'support@acme.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  supportEmail?: string;
}

export type EmailSettingsView = EmailBranding & {
  envDefaults: EmailBranding;
  source: {
    fromName: 'db' | 'env';
    fromEmail: 'db' | 'env';
    supportEmail: 'db' | 'env';
  };
};

@Injectable()
export class EmailSettingsService implements OnModuleInit {
  private readonly logger = new Logger(EmailSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.reloadFromDb();
  }

  async reloadFromDb(): Promise<EmailBranding> {
    const env = emailBrandingFromEnv();
    const rows = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            EMAIL_SETTING_KEYS.fromName,
            EMAIL_SETTING_KEYS.fromEmail,
            EMAIL_SETTING_KEYS.supportEmail,
          ],
        },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const branding: EmailBranding = {
      fromName: map[EMAIL_SETTING_KEYS.fromName]?.trim() || env.fromName,
      fromEmail: map[EMAIL_SETTING_KEYS.fromEmail]?.trim() || env.fromEmail,
      supportEmail:
        map[EMAIL_SETTING_KEYS.supportEmail]?.trim() ||
        map[EMAIL_SETTING_KEYS.fromEmail]?.trim() ||
        env.supportEmail,
    };

    setEmailBranding(branding);
    this.logger.log(
      `Email branding: ${branding.fromName} <${branding.fromEmail}>`,
    );
    return branding;
  }

  async getSettings(): Promise<EmailSettingsView> {
    const env = emailBrandingFromEnv();
    const rows = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            EMAIL_SETTING_KEYS.fromName,
            EMAIL_SETTING_KEYS.fromEmail,
            EMAIL_SETTING_KEYS.supportEmail,
          ],
        },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const fromNameDb = !!map[EMAIL_SETTING_KEYS.fromName]?.trim();
    const fromEmailDb = !!map[EMAIL_SETTING_KEYS.fromEmail]?.trim();
    const supportDb = !!map[EMAIL_SETTING_KEYS.supportEmail]?.trim();

    // Ensure cache matches DB (e.g. after concurrent updates)
    await this.reloadFromDb();
    const branding = getEmailBranding();

    return {
      ...branding,
      envDefaults: env,
      source: {
        fromName: fromNameDb ? 'db' : 'env',
        fromEmail: fromEmailDb ? 'db' : 'env',
        supportEmail: supportDb || fromEmailDb ? 'db' : 'env',
      },
    };
  }

  async updateSettings(dto: UpdateEmailSettingsDto): Promise<EmailSettingsView> {
    const upserts: { key: string; value: string }[] = [];

    if (dto.fromName !== undefined) {
      upserts.push({
        key: EMAIL_SETTING_KEYS.fromName,
        value: dto.fromName.trim(),
      });
    }
    if (dto.fromEmail !== undefined) {
      upserts.push({
        key: EMAIL_SETTING_KEYS.fromEmail,
        value: dto.fromEmail.trim().toLowerCase(),
      });
    }
    if (dto.supportEmail !== undefined) {
      upserts.push({
        key: EMAIL_SETTING_KEYS.supportEmail,
        value: dto.supportEmail.trim().toLowerCase(),
      });
    }

    for (const row of upserts) {
      await this.prisma.setting.upsert({
        where: { key: row.key },
        create: row,
        update: { value: row.value },
      });
    }

    return this.getSettings();
  }
}
