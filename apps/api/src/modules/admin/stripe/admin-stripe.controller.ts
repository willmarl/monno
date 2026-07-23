import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
  Post,
  HttpCode,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminStripeService } from './admin-stripe.service';
import { SubscriptionSearchDto } from '../../stripe/dto/search-subscription.dto';
import { ProductSearchDto } from '../../stripe/dto/search-product.dto';
import { CreditPurchaseSearchDto } from '../../stripe/dto/search-credit-purchase.dto';
import { CreditTransactionSearchDto } from '../../stripe/dto/search-credit-transaction.dto';
import { AdminCancelSubscriptionDto } from './dto/admin-stripe-actions.dto';

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

  @ApiOperation({
    summary: 'Stripe balance + recent purchases for admin dashboard',
  })
  @ApiBearerAuth()
  @Get('dashboard')
  async getDashboard(@Query('limit') limit?: string) {
    return this.adminStripeService.getDashboardOverview(
      limit ? Number(limit) : 8,
    );
  }

  @ApiOperation({ summary: 'Full-refund a product purchase via Stripe' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ProductPurchase id' })
  @ApiResponse({ status: 200, description: 'Refund created' })
  @Post('products/:id/refund')
  @HttpCode(200)
  async refundProduct(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.adminStripeService.refundProductPurchase(id, req.user?.sub);
  }

  @ApiOperation({ summary: 'Full-refund a credit purchase via Stripe' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'CreditPurchase id' })
  @ApiResponse({ status: 200, description: 'Refund created' })
  @Post('credit-purchases/:id/refund')
  @HttpCode(200)
  async refundCredit(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.adminStripeService.refundCreditPurchase(id, req.user?.sub);
  }

  @ApiOperation({
    summary: 'Cancel subscription at period end or immediately',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Local Subscription id' })
  @ApiBody({ type: AdminCancelSubscriptionDto })
  @Post('subscriptions/:id/cancel')
  @HttpCode(200)
  async cancelSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminCancelSubscriptionDto,
    @Req() req: any,
  ) {
    return this.adminStripeService.cancelSubscription(
      id,
      req.user?.sub,
      body.mode,
    );
  }

  @ApiOperation({ summary: 'List recent Stripe invoices for a subscription' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Local Subscription id' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('subscriptions/:id/invoices')
  async listInvoices(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    return this.adminStripeService.listSubscriptionInvoices(
      id,
      limit ? Number(limit) : 10,
    );
  }

  @ApiOperation({ summary: 'Send a draft Stripe invoice' })
  @ApiBearerAuth()
  @ApiParam({ name: 'invoiceId', description: 'Stripe invoice id (in_…)' })
  @Post('invoices/:invoiceId/send')
  @HttpCode(200)
  async sendInvoice(
    @Param('invoiceId') invoiceId: string,
    @Req() req: any,
  ) {
    return this.adminStripeService.sendInvoice(invoiceId, req.user?.sub);
  }

  @ApiOperation({ summary: 'Void an open Stripe invoice' })
  @ApiBearerAuth()
  @ApiParam({ name: 'invoiceId', description: 'Stripe invoice id (in_…)' })
  @Post('invoices/:invoiceId/void')
  @HttpCode(200)
  async voidInvoice(
    @Param('invoiceId') invoiceId: string,
    @Req() req: any,
  ) {
    return this.adminStripeService.voidInvoice(invoiceId, req.user?.sub);
  }
}
