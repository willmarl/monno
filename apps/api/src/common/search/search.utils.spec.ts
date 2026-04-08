import { describe, it, expect } from 'vitest';
import { buildSearchWhere } from './search.utils';

describe('buildSearchWhere', () => {
  // ── Empty / blank queries ────────────────────────────────────────────────

  it('returns {} for an empty string', () => {
    expect(buildSearchWhere({ query: '', fields: ['title'] })).toEqual({});
  });

  it('returns {} for a whitespace-only string', () => {
    expect(buildSearchWhere({ query: '   ', fields: ['title'] })).toEqual({});
  });

  it('returns {} when fields array is empty', () => {
    expect(buildSearchWhere({ query: 'hello', fields: [] })).toEqual({});
  });

  // ── Single field ─────────────────────────────────────────────────────────

  it('returns a flat condition (no OR) for a single field', () => {
    const result = buildSearchWhere({ query: 'hello', fields: ['title'] });
    expect(result).toEqual({
      title: { contains: 'hello', mode: 'insensitive' },
    });
  });

  it('trims leading/trailing whitespace from the query', () => {
    const result = buildSearchWhere({ query: '  hello  ', fields: ['title'] });
    expect(result).toEqual({
      title: { contains: 'hello', mode: 'insensitive' },
    });
  });

  it('is case-insensitive by default', () => {
    const result = buildSearchWhere({ query: 'Hello', fields: ['title'] });
    expect(result.title.mode).toBe('insensitive');
  });

  // ── Case sensitivity option ───────────────────────────────────────────────

  it('omits mode when caseSensitive is true', () => {
    const result = buildSearchWhere({
      query: 'Hello',
      fields: ['title'],
      options: { caseSensitive: true },
    });
    expect(result).toEqual({ title: { contains: 'Hello' } });
    expect(result.title.mode).toBeUndefined();
  });

  // ── Multiple fields → OR ──────────────────────────────────────────────────

  it('wraps multiple fields in OR', () => {
    const result = buildSearchWhere({
      query: 'test',
      fields: ['title', 'content'],
    });
    expect(result).toEqual({
      OR: [
        { title: { contains: 'test', mode: 'insensitive' } },
        { content: { contains: 'test', mode: 'insensitive' } },
      ],
    });
  });

  it('generates correct OR conditions for three fields', () => {
    const result = buildSearchWhere({
      query: 'x',
      fields: ['a', 'b', 'c'],
    });
    expect(result.OR).toHaveLength(3);
  });

  // ── Nested fields ─────────────────────────────────────────────────────────

  it('supports nested fields using dot notation', () => {
    const result = buildSearchWhere({
      query: 'alice',
      fields: ['creator.username'],
    });
    expect(result).toEqual({
      creator: { username: { contains: 'alice', mode: 'insensitive' } },
    });
  });

  it('supports deeply nested fields', () => {
    const result = buildSearchWhere({
      query: 'val',
      fields: ['a.b.c'],
    });
    expect(result).toEqual({
      a: { b: { c: { contains: 'val', mode: 'insensitive' } } },
    });
  });

  // ── Boundary values ───────────────────────────────────────────────────────

  it('handles a 1-character query', () => {
    const result = buildSearchWhere({ query: 'a', fields: ['title'] });
    expect(result).toEqual({
      title: { contains: 'a', mode: 'insensitive' },
    });
  });

  it('handles a very long query (1000 chars)', () => {
    const longQuery = 'a'.repeat(1000);
    const result = buildSearchWhere({ query: longQuery, fields: ['title'] });
    expect(result.title.contains).toBe(longQuery);
  });

  it('handles a query with special characters', () => {
    const result = buildSearchWhere({
      query: "it's a <test> & \"more\"",
      fields: ['title'],
    });
    expect(result.title.contains).toBe("it's a <test> & \"more\"");
  });

  it('handles a purely numeric query', () => {
    const result = buildSearchWhere({ query: '12345', fields: ['title'] });
    expect(result.title.contains).toBe('12345');
  });

  // ── Fields filtering ──────────────────────────────────────────────────────

  it('filters out empty string entries in the fields array', () => {
    // EP: mixed valid/invalid fields — empty strings should be ignored
    const result = buildSearchWhere({ query: 'hello', fields: ['title', ''] });
    // Only 'title' survives the filter → flat condition, no OR
    expect(result).toEqual({ title: { contains: 'hello', mode: 'insensitive' } });
  });

  it('returns {} when all fields are empty strings', () => {
    // EP: all invalid fields → orConditions.length === 0 branch
    const result = buildSearchWhere({ query: 'hello', fields: ['', '   '] });
    expect(result).toEqual({});
  });

  it('caseSensitive=false is identical to the default', () => {
    const withDefault = buildSearchWhere({ query: 'Hi', fields: ['title'] });
    const withExplicit = buildSearchWhere({ query: 'Hi', fields: ['title'], options: { caseSensitive: false } });
    expect(withExplicit).toEqual(withDefault);
  });
});
