import { IsOptional, IsString, IsBoolean, IsIn, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { ArticleStatus } from '../../../generated/prisma/client';

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

export enum ArticleSearchFields {
  TITLE = 'title',
  CONTENT = 'content',
  CREATOR_USERNAME = 'creator.username',
}

export enum ArticleAvailability {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

const VALID_ARTICLE_SEARCH_FIELDS = Object.values(ArticleSearchFields);

function ArticleSearchMixin<TBase extends new (...args: any[]) => {}>(
  Base: TBase,
) {
  class Mixed extends Base {
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

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
      description:
        'Comma-separated list of statuses to filter by (e.g., DRAFT,PUBLISHED,ARCHIVED,SCHEDULED)',
    })
    statuses?: string;

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
        'Filter by availability. ALL shows both active and deleted, ACTIVE shows only active, DELETED shows only deleted. Defaults to ALL.',
      enum: ArticleAvailability,
      example: ArticleAvailability.ALL,
    })
    @IsOptional()
    @IsEnum(ArticleAvailability)
    availability?: ArticleAvailability;

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
        return VALID_ARTICLE_SEARCH_FIELDS;
      }

      return this.searchFields
        .split(',')
        .map((field) => field.trim())
        .filter((field) => VALID_ARTICLE_SEARCH_FIELDS.includes(field as any));
    }

    /**
     * Parse and validate statuses filter into an array
     * Invalid statuses are silently ignored
     */
    getStatuses(): string[] {
      if (!this.statuses) return [];

      const validStatuses = Object.values(ArticleStatus);
      // const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED'];
      return this.statuses
        .split(',')
        .map((status) => status.trim().toUpperCase())
        .filter((status) => validStatuses.includes(status as ArticleStatus));
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
  return Mixed;
}

export class ArticleSearchDto extends ArticleSearchMixin(PaginationDto) {}
export class ArticleSearchCursorDto extends ArticleSearchMixin(
  CursorPaginationDto,
) {}
