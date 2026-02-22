import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

const DEFAULT_PRODUCT_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  type: true,
  priceInCents: true,
  priceInCredits: true,
  requiresSubscription: true,
  requiredTier: true,
  published: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enrich products with ownership information
   */
  private async enrichProductsWithOwnership(products: any[], userId?: number) {
    if (!userId) {
      // No user logged in, all products are not owned
      return products.map((p) => ({ ...p, ownedByMe: false }));
    }

    return Promise.all(
      products.map(async (product) => {
        const purchase = await this.prisma.productPurchase.findUnique({
          where: {
            userId_productId: {
              userId,
              productId: product.id,
            },
          },
        });

        return {
          ...product,
          ownedByMe: !!purchase && purchase.status === 'ACTIVE',
        };
      }),
    );
  }

  /**
   * Get all published products (basic list, no pagination)
   */
  async findAll(userId?: number) {
    const products = await this.prisma.product.findMany({
      where: { published: true },
      select: DEFAULT_PRODUCT_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichProductsWithOwnership(products, userId);
  }

  /**
   * Get product by ID
   */
  async findById(id: string, userId?: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: DEFAULT_PRODUCT_SELECT,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Only allow access to published products (unless admin later)
    if (!product.published) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const [enrichedProduct] = await this.enrichProductsWithOwnership(
      [product],
      userId,
    );
    return enrichedProduct;
  }

  /**
   * Get product by slug
   */
  async findBySlug(slug: string, userId?: number) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: DEFAULT_PRODUCT_SELECT,
    });

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    // Only allow access to published products (unless admin later)
    if (!product.published) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    const [enrichedProduct] = await this.enrichProductsWithOwnership(
      [product],
      userId,
    );
    return enrichedProduct;
  }

  /**
   * Get product content (markdown + ownership check)
   * Used when user is accessing purchased product
   */
  async getProductContent(productId: string, userId?: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        contentMarkdown: true,
        requiresSubscription: true,
        requiredTier: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    // Check if user has access (owns product OR has required subscription)
    if (userId) {
      // Check if user owns the product
      const purchase = await this.prisma.productPurchase.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      if (purchase && purchase.status === 'ACTIVE') {
        return { ...product, hasAccess: true };
      }

      // Check if user has required subscription tier
      if (product.requiresSubscription) {
        const subscription = await this.prisma.subscription.findUnique({
          where: { userId },
        });

        if (subscription && subscription.status === 'ACTIVE') {
          const tierHierarchy = ['FREE', 'BASIC', 'PRO'];
          const userTierIndex = tierHierarchy.indexOf(subscription.tier);
          const requiredTierIndex = tierHierarchy.indexOf(
            product.requiredTier || 'FREE',
          );

          if (userTierIndex >= requiredTierIndex) {
            return { ...product, hasAccess: true };
          }
        }
      }
    }

    // User doesn't have access
    return { ...product, hasAccess: false };
  }
}
