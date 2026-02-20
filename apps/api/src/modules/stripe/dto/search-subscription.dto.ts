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

export enum SubscriptionSearchFields {
  TIER = 'tier',
  STATUS = 'status',
  USERNAME = 'userId.username',
}

const VALID_SUBSCRIPTION_SEARCH_FIELDS = Object.values(
  SubscriptionSearchFields,
);

/**
 * Search DTO for subscriptions with offset pagination
 * Extends PaginationDto with search-specific parameters
 *
 * @example
 * GET /subscriptions/search?query=hello&searchFields=title,content&limit=10&offset=0&caseSensitive=false&sort=createdAt|desc
 */
export class SubscriptionSearchDto extends PaginationDto {
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

  /**
   * Parse and validate searchFields into an array of valid fields
   * Invalid fields are silently ignored
   */
  getSearchFields(): string[] {
    if (!this.searchFields) {
      // Default to all fields
      return VALID_SUBSCRIPTION_SEARCH_FIELDS;
    }

    return this.searchFields
      .split(',')
      .map((field) => field.trim())
      .filter((field) =>
        VALID_SUBSCRIPTION_SEARCH_FIELDS.includes(field as any),
      );
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
    const validFields = ['createdAt', 'updatedAt'];
    const validDirection = ['asc', 'desc'].includes(direction?.toLowerCase())
      ? (direction?.toLowerCase() as 'asc' | 'desc')
      : 'desc';

    if (!validFields.includes(field)) {
      return { createdAt: 'desc' };
    }

    return { [field]: validDirection };
  }
}
