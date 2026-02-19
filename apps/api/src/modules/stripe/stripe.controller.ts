import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
  Logger,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { StripeConfiguredGuard } from '../../common/guards/stripe-configured.guard';
import { OwnerOrAdminGuard } from '../../common/guards/owner-or-admin.guard';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import Stripe from 'stripe';

@Controller('stripe')
@UseGuards(StripeConfiguredGuard)
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  @UseGuards(JwtAccessGuard)
  async createCheckoutSession(
    @Req() req,
    @Body() body: CreateCheckoutSessionDto,
  ) {
    const userId = req.user.sub;
    return this.stripeService.createCheckoutSession(userId, body);
  }

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<any>) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody;

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!rawBody) {
      throw new BadRequestException('Request body is required');
    }

    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
      return this.stripeService.handleWebhook(event);
    } catch (err) {
      Logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  @Post('customer-portal')
  @UseGuards(JwtAccessGuard)
  async customerPortal(@Req() req) {
    const userId = req.user.sub;
    return this.stripeService.createCustomerPortal(userId);
  }

  @Get('subscription/:userId')
  @UseGuards(JwtAccessGuard, OwnerOrAdminGuard)
  async getUserSubscription(@Param('userId', ParseIntPipe) userId: number) {
    return this.stripeService.getUserSubscription(userId);
  }

  @Get('products/:userId')
  @UseGuards(JwtAccessGuard, OwnerOrAdminGuard)
  async getUserAllProducts(@Param('userId', ParseIntPipe) userId: number) {
    return this.stripeService.getUserAllProducts(userId);
  }

  @Get('products/owned/:userId')
  @UseGuards(JwtAccessGuard, OwnerOrAdminGuard)
  async getUserOwnedProducts(@Param('userId', ParseIntPipe) userId: number) {
    return this.stripeService.getUserOwnedProducts(userId);
  }

  @Get('credit-purchases/:userId')
  @UseGuards(JwtAccessGuard, OwnerOrAdminGuard)
  async getUserCreditPurchases(@Param('userId', ParseIntPipe) userId: number) {
    return this.stripeService.getUserCreditPurchases(userId);
  }

  @Get('credit-transactions/:userId')
  @UseGuards(JwtAccessGuard, OwnerOrAdminGuard)
  async getUserCreditTransactions(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.stripeService.getUserCreditTransactions(userId);
  }
}
