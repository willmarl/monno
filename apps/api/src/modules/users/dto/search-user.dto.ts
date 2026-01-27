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

export enum UserSearchFields {
  USERNAME = 'username',
  EMAIL = 'email',
}

const VALID_USER_SEARCH_FIELDS = Object.values(UserSearchFields);

/**
 * Search DTO for users with offset pagination
 * Extends PaginationDto with search-specific parameters
 *
 * @example
 * GET /users/search?query=hello&searchFields=username,email&roles=USER,MOD&statuses=ACTIVE,BANNED&limit=10&offset=0&caseSensitive=false
 */
export class UserSearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  searchFields?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Comma-separated list of roles to filter by (e.g., USER,ADMIN,MOD)',
  })
  roles?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Comma-separated list of statuses to filter by (e.g., ACTIVE,SUSPENDED,BANNED,DELETED)',
  })
  statuses?: string;

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  caseSensitive?: boolean;

  /**
   * Parse and validate searchFields into an array of valid fields
   * Invalid fields are silently ignored
   */
  getSearchFields(): string[] {
    if (!this.searchFields) {
      // Default to all fields
      return VALID_USER_SEARCH_FIELDS;
    }

    return this.searchFields
      .split(',')
      .map((field) => field.trim())
      .filter((field) => VALID_USER_SEARCH_FIELDS.includes(field as any));
  }

  /**
   * Parse and validate roles filter into an array
   * Invalid roles are silently ignored
   */
  getRoles(): string[] {
    if (!this.roles) return [];

    const validRoles = ['USER', 'ADMIN', 'MOD'];
    return this.roles
      .split(',')
      .map((role) => role.trim().toUpperCase())
      .filter((role) => validRoles.includes(role));
  }

  /**
   * Parse and validate statuses filter into an array
   * Invalid statuses are silently ignored
   */
  getStatuses(): string[] {
    if (!this.statuses) return [];

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED'];
    return this.statuses
      .split(',')
      .map((status) => status.trim().toUpperCase())
      .filter((status) => validStatuses.includes(status));
  }

  /**
   * Get search options (caseSensitive flag)
   */
  getSearchOptions() {
    return {
      caseSensitive: this.caseSensitive ?? false,
    };
  }
}

/**
 * Search DTO for Users with cursor pagination
 * Extends CursorPaginationDto with search-specific parameters
 */
export class UserSearchCursorDto extends CursorPaginationDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  searchFields?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Comma-separated list of roles to filter by (e.g., USER,ADMIN,MOD)',
  })
  roles?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Comma-separated list of statuses to filter by (e.g., ACTIVE,SUSPENDED,BANNED,DELETED)',
  })
  statuses?: string;

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  caseSensitive?: boolean;

  /**
   * Parse and validate searchFields into an array of valid fields
   * Invalid fields are silently ignored
   */
  getSearchFields(): string[] {
    if (!this.searchFields) {
      // Default to all fields
      return VALID_USER_SEARCH_FIELDS;
    }

    return this.searchFields
      .split(',')
      .map((field) => field.trim())
      .filter((field) => VALID_USER_SEARCH_FIELDS.includes(field as any));
  }

  /**
   * Parse and validate roles filter into an array
   * Invalid roles are silently ignored
   */
  getRoles(): string[] {
    if (!this.roles) return [];

    const validRoles = ['USER', 'ADMIN', 'MOD'];
    return this.roles
      .split(',')
      .map((role) => role.trim().toUpperCase())
      .filter((role) => validRoles.includes(role));
  }

  /**
   * Parse and validate statuses filter into an array
   * Invalid statuses are silently ignored
   */
  getStatuses(): string[] {
    if (!this.statuses) return [];

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED'];
    return this.statuses
      .split(',')
      .map((status) => status.trim().toUpperCase())
      .filter((status) => validStatuses.includes(status));
  }

  /**
   * Get search options (caseSensitive flag)
   */
  getSearchOptions() {
    return {
      caseSensitive: this.caseSensitive ?? false,
    };
  }
}
