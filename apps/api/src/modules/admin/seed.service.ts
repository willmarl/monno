import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * Seed Service
 * Initializes database with seeded admin account on startup
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Seed admin account from environment variables
   * Called on application startup
   * Only runs once - subsequent startups will skip if ADMIN_SEEDED flag exists
   */
  async seedAdminAccount() {
    try {
      // Check if admin seeding has already been completed
      const hasSeeded = await this.prisma.setting.findUnique({
        where: { key: 'ADMIN_SEEDED' },
      });

      if (hasSeeded) {
        this.logger.debug('✓ Admin account already seeded in database');
        return;
      }

      const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
      const adminEmail = process.env.SEED_ADMIN_EMAIL || null; // Optional
      const adminPassword = process.env.SEED_ADMIN_PASSWORD;

      if (!adminPassword) {
        this.logger.warn(
          '⚠️  SEED_ADMIN_PASSWORD not set in environment. Skipping admin seed.',
        );
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin account
      const admin = await this.prisma.user.create({
        data: {
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          isEmailVerified: adminEmail ? true : false, // Only auto-verify if email provided
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      });

      // Mark seeding as complete
      await this.prisma.setting.create({
        data: {
          key: 'ADMIN_SEEDED',
          value: 'true',
        },
      });

      this.logger.log(
        `✓ Seeded admin account successfully! Username: ${admin.username}`,
      );
      this.logger.log(`  Email: ${admin.email || '(none)'}`);
      this.logger.log(`  ID: ${admin.id}`);
    } catch (error) {
      this.logger.error('Failed to seed admin account:', error);
      throw error;
    }
  }
}
