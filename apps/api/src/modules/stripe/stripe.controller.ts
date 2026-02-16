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
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Controller('stripe')
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
  async webhook(@Req() req, @Body() body) {
    return this.stripeService.handleWebhook(body);
  }
}
