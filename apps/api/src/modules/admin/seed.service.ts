import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { SubscriptionTier } from '../../generated/prisma/client';

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

  /**
   * Seed products from markdown files
   * Reads .md files from products/ folder with frontmatter
   * Only runs once - subsequent startups will skip if PRODUCTS_SEEDED flag exists
   */
  async seedProducts() {
    try {
      // Check if products seeding has already been completed
      const hasSeeded = await this.prisma.setting.findUnique({
        where: { key: 'PRODUCTS_SEEDED' },
      });

      if (hasSeeded) {
        this.logger.debug('✓ Products already seeded in database');
        return;
      }

      // Path to products folder
      const productsDir = path.join(process.cwd(), '/products');

      // Check if products directory exists
      if (!fs.existsSync(productsDir)) {
        this.logger.warn(`⚠️  Products directory not found at: ${productsDir}`);
        return;
      }

      // Read all .md files
      const files = fs
        .readdirSync(productsDir)
        .filter((file) => file.endsWith('.md'));

      this.logger.log(`📄 Found ${files.length} product files`);

      if (files.length === 0) {
        this.logger.warn('⚠️  No markdown files found in products directory');
        return;
      }

      let created = 0;
      let updated = 0;

      // Process each file
      for (const file of files) {
        const filePath = path.join(productsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Parse frontmatter and content
        const { data, content } = matter(fileContent);
        const frontmatter = data as {
          title?: string;
          slug?: string;
          description?: string;
          type?: string;
          requiresSubscription?: boolean;
          requiredTier?: SubscriptionTier | null;
          priceInCents?: number | null;
          priceInCredits?: number | null;
          published?: boolean;
        };

        // Validate required fields
        if (!frontmatter.title || !frontmatter.slug) {
          this.logger.warn(
            `⚠️  Skipping ${file} - missing title or slug in frontmatter`,
          );
          continue;
        }

        // Validate pricing - at least one must be set UNLESS it's subscription-gated
        const hasMoneyPrice =
          frontmatter.priceInCents !== null &&
          frontmatter.priceInCents !== undefined;
        const hasCreditsPrice =
          frontmatter.priceInCredits !== null &&
          frontmatter.priceInCredits !== undefined;
        const isSubscriptionGated = frontmatter.requiresSubscription === true;

        if (!hasMoneyPrice && !hasCreditsPrice && !isSubscriptionGated) {
          this.logger.warn(
            `⚠️  Skipping ${frontmatter.slug} - must have either priceInCents, priceInCredits, or requiresSubscription=true`,
          );
          continue;
        }

        // Check if product exists
        const existingProduct = await this.prisma.product.findUnique({
          where: { slug: frontmatter.slug },
        });

        const productData = {
          slug: frontmatter.slug,
          title: frontmatter.title,
          description: frontmatter.description || null,
          type: frontmatter.type || 'course',
          priceInCents: hasMoneyPrice ? frontmatter.priceInCents : null,
          priceInCredits: hasCreditsPrice ? frontmatter.priceInCredits : null,
          requiresSubscription: frontmatter.requiresSubscription ?? false,
          requiredTier: frontmatter.requiredTier ?? null,
          contentMarkdown: content, // Store the markdown content
          published: frontmatter.published ?? false,
        };

        if (existingProduct) {
          // Update existing product
          await this.prisma.product.update({
            where: { slug: frontmatter.slug },
            data: productData,
          });
          updated++;
          this.logger.log(`  ✓ Updated: ${frontmatter.title}`);
        } else {
          // Create new product
          await this.prisma.product.create({
            data: productData,
          });
          created++;
          this.logger.log(`  ✓ Created: ${frontmatter.title}`);
        }
      }

      // Mark seeding as complete
      await this.prisma.setting.create({
        data: {
          key: 'PRODUCTS_SEEDED',
          value: 'true',
        },
      });

      this.logger.log(
        `✓ Product seeding complete! Created: ${created}, Updated: ${updated}`,
      );
    } catch (error) {
      this.logger.error('Failed to seed products:', error);
      throw error;
    }
  }
}
