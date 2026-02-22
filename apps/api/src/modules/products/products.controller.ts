import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  /**
   * GET /products
   * Get all published products with ownership info
   */
  @Get()
  async findAll(@CurrentUser() user?: { id: number }) {
    return this.productsService.findAll(user?.id);
  }

  /**
   * GET /products/:idOrSlug
   * Get single product by ID or slug
   * UUID IDs vs slug strings will be distinguished naturally
   */
  @Get(':idOrSlug')
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user?: { id: number },
  ) {
    // Try to find by ID first (UUID format), fallback to slug
    try {
      return await this.productsService.findById(idOrSlug, user?.id);
    } catch (error) {
      // If not found by ID, try by slug
      return await this.productsService.findBySlug(idOrSlug, user?.id);
    }
  }

  /**
   * GET /products/:productId/content
   * Get product content (markdown) with access validation
   * User must own the product OR have required subscription
   */
  @Get(':productId/content')
  async getProductContent(
    @Param('productId') productId: string,
    @CurrentUser() user?: { id: number },
  ) {
    return this.productsService.getProductContent(productId, user?.id);
  }
}
