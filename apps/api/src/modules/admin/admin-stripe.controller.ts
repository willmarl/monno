import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminStripeService } from './admin-stripe.service';
import { SubscriptionSearchDto } from '../stripe/dto/search-subscription.dto';
import { ProductSearchDto } from '../stripe/dto/search-product.dto';
import { CreditPurchaseSearchDto } from '../stripe/dto/search-credit-purchase.dto';
import { CreditTransactionSearchDto } from '../stripe/dto/search-credit-transaction.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

@ApiTags('admin-stripes')
@Controller('admin/stripe')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminStripeController {
  constructor(private readonly adminStripeService: AdminStripeService) {}

  @Get('subscription')
  async getSubscriptions(@Query() searchDto: SubscriptionSearchDto) {
    return this.adminStripeService.getSubscriptions(searchDto);
  }

  @Get('products')
  async getProducts(@Query() searchDto: ProductSearchDto) {
    return this.adminStripeService.getProducts(searchDto);
  }

  @Get('credit-purchases')
  async getCreditPurchases(@Query() searchDto: CreditPurchaseSearchDto) {
    return this.adminStripeService.getCreditPurchases(searchDto);
  }

  @Get('credit-transactions')
  async getCreditTransactions(@Query() searchDto: CreditTransactionSearchDto) {
    return this.adminStripeService.getCreditTransactions(searchDto);
  }
}
