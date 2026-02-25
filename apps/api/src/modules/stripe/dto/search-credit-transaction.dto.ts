import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';

/**
 * Transform string booleans from query params to actual booleans
 * Query strings always come as strings, so "false" is truthy
 */
const TransformBoolean = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1' || value === 1;
  });

export enum CreditTransactionSearchFields {
  TYPE = 'type',
  REASON = 'reason',
  USERNAME = 'user.username',
}

const VALID_CREDIT_SEARCH_FIELDS = Object.values(CreditTransactionSearchFields);

/**
 * Search DTO for posts with offset pagination
 * Extends PaginationDto with search-specific parameters
 *
 * @example
 * GET /posts/search?query=hello&searchFields=title,content&limit=10&offset=0&caseSensitive=false&sort=createdAt|desc
 */
export class CreditTransactionSearchDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search query string',
    example: 'hello world',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description:
      'Comma-separated list of fields to search in (title, content, creator.username). Defaults to all.',
    example: 'title,content',
  })
  @IsOptional()
  @IsString()
  searchFields?: string;

  @ApiPropertyOptional({
    description: 'Enable case-sensitive search (default: false)',
    example: false,
  })
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  caseSensitive?: boolean;

  @ApiPropertyOptional({
    description:
      'Sort by field and direction (field|direction). E.g., createdAt|desc, updatedAt|asc',
    example: 'createdAt|desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description:
      'Filter by transaction type (PURCHASE, SPEND, REFUND, ADMIN_ADJUST)',
    example: 'PURCHASE',
  })
  @IsOptional()
  @IsString()
  type?: string;

  /**
   * Parse and validate searchFields into an array of valid fields
   * Invalid fields are silently ignored
   * Enum fields (type) are excluded from text search - use type filter instead
   */
  getSearchFields(): string[] {
    if (!this.searchFields) {
      // Default to only string fields (exclude enum: type)
      return [
        CreditTransactionSearchFields.REASON,
        CreditTransactionSearchFields.USERNAME,
      ];
    }

    return this.searchFields
      .split(',')
      .map((field) => field.trim())
      .filter((field) => {
        if (!VALID_CREDIT_SEARCH_FIELDS.includes(field as any)) {
          return false;
        }
        // Exclude enum field from text search
        if (field === CreditTransactionSearchFields.TYPE) {
          return false;
        }
        return true;
      });
  }

  /**
   * Get search options (caseSensitive flag)
   */
  getSearchOptions() {
    return {
      caseSensitive: this.caseSensitive ?? false,
    };
  }

  /**
   * Parse sort parameter into Prisma orderBy clause
   * Format: "field|direction" e.g., "createdAt|desc"
   * Defaults to createdAt|desc
   */
  getOrderBy(): Record<string, 'asc' | 'desc'> {
    if (!this.sort) {
      return { createdAt: 'desc' };
    }

    const [field, direction] = this.sort.split('|');
    const validFields = [
      'createdAt',
      'amount',
      'balanceBefore',
      'balanceAfter',
    ];
    const validDirection = ['asc', 'desc'].includes(direction?.toLowerCase())
      ? (direction?.toLowerCase() as 'asc' | 'desc')
      : 'desc';

    if (!validFields.includes(field)) {
      return { createdAt: 'desc' };
    }

    return { [field]: validDirection };
  }
}
