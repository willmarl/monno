import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import { AdminService } from './admin.service';
import { SubscriptionSearchDto } from '../stripe/dto/search-subscription.dto';
import { ProductSearchDto } from '../stripe/dto/search-product.dto';
import { CreditPurchaseSearchDto } from '../stripe/dto/search-credit-purchase.dto';
import { CreditTransactionSearchDto } from '../stripe/dto/search-credit-transaction.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

const DEFAULT_SUBSCRIPTION_SELECT = {
  id: true,
  status: true,
  tier: true,
  nextTier: true,
  periodStart: true,
  periodEnd: true,
  createdAt: true,
  updatedAt: true,
  stripeId: true,
  user: {
    select: { id: true, username: true, avatarPath: true },
  },
};

const DEFAULT_PRODUCTS_SELECT = {
  id: true,
  productId: true,
  status: true,
  purchasedAt: true,
  refundedAt: true,
  stripeId: true,
  user: {
    select: { id: true, username: true, avatarPath: true },
  },
};

const DEFAULT_CREDITS_TRANSACTIONS_SELECT = {
  id: true,
  type: true,
  amount: true,
  reason: true,
  balanceBefore: true,
  balanceAfter: true,
  createdAt: true,
  user: {
    select: { id: true, username: true, avatarPath: true },
  },
};

const DEFAULT_CREDITS_PURCHASES_SELECT = {
  id: true,
  amount: true,
  currency: true,
  pricePaid: true,
  purchasedAt: true,
  stripeId: true,
  user: {
    select: { id: true, username: true, avatarPath: true },
  },
};

@Injectable()
export class AdminStripeService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}

  async getSubscriptions(searchDto: SubscriptionSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions for enums
    const filterConditions: any[] = [];

    if (searchDto.status) {
      filterConditions.push({ status: searchDto.status });
    }

    if (searchDto.tier) {
      filterConditions.push({ tier: searchDto.tier });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.subscription,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_SUBSCRIPTION_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async getProducts(searchDto: ProductSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.productPurchase,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where: where,
        orderBy,
        select: DEFAULT_PRODUCTS_SELECT,
      },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async getCreditPurchases(searchDto: CreditPurchaseSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.creditPurchase,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where: where,
        orderBy,
        select: DEFAULT_CREDITS_PURCHASES_SELECT,
      },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }
  async getCreditTransactions(searchDto: CreditTransactionSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.creditTransaction,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where: where,
        orderBy,
        select: DEFAULT_CREDITS_TRANSACTIONS_SELECT,
      },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }
}
