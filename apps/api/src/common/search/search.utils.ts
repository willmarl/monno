import { Prisma } from '../../generated/prisma/client';

export interface SearchOptions {
  caseSensitive?: boolean;
}

export interface SearchWhereInput {
  query: string;
  fields: string[];
  options?: SearchOptions;
}

/**
 * Builds a Prisma WHERE clause for searching across multiple fields
 * Combines fields with OR logic using substring/fuzzy matching by default
 *
 * @param input - Search parameters
 * @returns Prisma WHERE clause or empty object if query is empty
 *
 * @example
 * const where = buildSearchWhere({
 *   query: 'hello',
 *   fields: ['title', 'content'],
 *   options: { caseSensitive: false }
 * });
 * // Returns: { OR: [{ title: { contains: 'hello', mode: 'insensitive' } }, ...] }
 */
export function buildSearchWhere(input: SearchWhereInput): any {
  const { query, fields, options = {} } = input;
  const { caseSensitive = false } = options;

  // Empty query returns empty where clause (no filtering)
  if (!query || !query.trim()) {
    return {};
  }

  const trimmedQuery = query.trim();

  // Build OR conditions for each field
  const orConditions = fields
    .filter((field) => field && field.trim()) // Filter out empty field names
    .map((field) => {
      const fieldPath = field.split('.'); // Support nested fields like 'creator.username'

      if (fieldPath.length === 1) {
        // Simple field - use substring/fuzzy matching
        return {
          [field]: caseSensitive
            ? { contains: trimmedQuery }
            : { contains: trimmedQuery, mode: 'insensitive' },
        };
      } else {
        // Nested field (e.g., creator.username) - use nested object notation
        let nestedCondition: any = {};
        let current = nestedCondition;

        for (let i = 0; i < fieldPath.length - 1; i++) {
          current[fieldPath[i]] = {};
          current = current[fieldPath[i]];
        }

        // Apply search condition to the final field - use substring/fuzzy matching
        const lastField = fieldPath[fieldPath.length - 1];
        current[lastField] = caseSensitive
          ? { contains: trimmedQuery }
          : { contains: trimmedQuery, mode: 'insensitive' };

        return nestedCondition;
      }
    });

  if (orConditions.length === 0) {
    return {};
  }

  if (orConditions.length === 1) {
    return orConditions[0];
  }

  return { OR: orConditions };
}
