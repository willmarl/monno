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

export enum PostSearchFields {
  TITLE = 'title',
  CONTENT = 'content',
  CREATOR_USERNAME = 'creator.username',
}

const VALID_POST_SEARCH_FIELDS = Object.values(PostSearchFields);

/**
 * Search DTO for posts with offset pagination
 * Extends PaginationDto with search-specific parameters
 *
 * @example
 * GET /posts/search?query=hello&searchFields=title,content&limit=10&offset=0&caseSensitive=false&sort=createdAt|desc
 */
export class PostSearchDto extends PaginationDto {
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
      'Sort by field and direction (field|direction). E.g., createdAt|desc, updatedAt|asc, viewCount|desc',
    example: 'createdAt|desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description:
      'Filter by deleted status. If not provided, shows both deleted and active posts.',
    example: false,
  })
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  deleted?: boolean;

  /**
   * Parse and validate searchFields into an array of valid fields
   * Invalid fields are silently ignored
   */
  getSearchFields(): string[] {
    if (!this.searchFields) {
      // Default to all fields
      return VALID_POST_SEARCH_FIELDS;
    }

    return this.searchFields
      .split(',')
      .map((field) => field.trim())
      .filter((field) => VALID_POST_SEARCH_FIELDS.includes(field as any));
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
   * Valid fields: createdAt, updatedAt, viewCount, likeCount
   * Defaults to createdAt|desc
   */
  getOrderBy(): Record<string, 'asc' | 'desc'> {
    if (!this.sort) {
      return { createdAt: 'desc' };
    }

    const [field, direction] = this.sort.split('|');
    const validFields = ['createdAt', 'updatedAt', 'viewCount', 'likeCount'];
    const validDirection = ['asc', 'desc'].includes(direction?.toLowerCase())
      ? (direction?.toLowerCase() as 'asc' | 'desc')
      : 'desc';

    if (!validFields.includes(field)) {
      return { createdAt: 'desc' };
    }

    return { [field]: validDirection };
  }
}

/**
 * Search DTO for posts with cursor pagination
 * Extends CursorPaginationDto with search-specific parameters
 */
export class PostSearchCursorDto extends CursorPaginationDto {
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
      'Sort by field and direction (field|direction). E.g., createdAt|desc, updatedAt|asc, viewCount|desc',
    example: 'createdAt|desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description:
      'Filter by deleted status. If not provided, shows both deleted and active posts.',
    example: false,
  })
  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  deleted?: boolean;

  /**
   * Parse and validate searchFields into an array of valid fields
   * Invalid fields are silently ignored
   */
  getSearchFields(): string[] {
    if (!this.searchFields) {
      // Default to all fields
      return VALID_POST_SEARCH_FIELDS;
    }

    return this.searchFields
      .split(',')
      .map((field) => field.trim())
      .filter((field) => VALID_POST_SEARCH_FIELDS.includes(field as any));
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
   * Valid fields: createdAt, updatedAt, viewCount, likeCount
   * Defaults to createdAt|desc
   */
  getOrderBy(): Record<string, 'asc' | 'desc'> {
    if (!this.sort) {
      return { createdAt: 'desc' };
    }

    const [field, direction] = this.sort.split('|');
    const validFields = ['createdAt', 'updatedAt', 'viewCount', 'likeCount'];
    const validDirection = ['asc', 'desc'].includes(direction?.toLowerCase())
      ? (direction?.toLowerCase() as 'asc' | 'desc')
      : 'desc';

    if (!validFields.includes(field)) {
      return { createdAt: 'desc' };
    }

    return { [field]: validDirection };
  }
}
