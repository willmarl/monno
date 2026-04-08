import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cursorPaginate } from './cursor-pagination';

describe('cursorPaginate', () => {
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findMany: vi.fn(),
    };
  });

  // ── First page (no cursor) ────────────────────────────────────────────────

  it('fetches first page when no cursor is provided', async () => {
    mockModel.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const result = await cursorPaginate({
      model: mockModel,
      limit: 3,
      query: {},
    });

    expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(result.nextCursor).toBeNull();
    // Without cursor: skip=0, cursor=undefined
    expect(mockModel.findMany).toHaveBeenCalledWith({
      take: 4, // limit + 1
      skip: 0,
      cursor: undefined,
    });
  });

  it('returns nextCursor when more items exist', async () => {
    // Return limit+1 items (extra item signals there is a next page)
    mockModel.findMany.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 }, // the "peeked" extra item
    ]);

    const result = await cursorPaginate({
      model: mockModel,
      limit: 3,
      query: {},
    });

    // Extra item is popped; its id becomes the next cursor
    expect(result.items).toHaveLength(3);
    expect(result.nextCursor).toBe(4);
  });

  // ── With cursor ───────────────────────────────────────────────────────────

  it('passes cursor to findMany with skip=1', async () => {
    mockModel.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }]);

    await cursorPaginate({
      model: mockModel,
      limit: 2,
      cursor: 4,
      query: {},
    });

    expect(mockModel.findMany).toHaveBeenCalledWith({
      take: 3, // limit + 1
      skip: 1, // skip the cursor item itself
      cursor: { id: 4 },
    });
  });

  it('returns null nextCursor when on last page (with cursor)', async () => {
    mockModel.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }]);

    const result = await cursorPaginate({
      model: mockModel,
      limit: 3,
      cursor: 4,
      query: {},
    });

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });

  // ── Empty results ────────────────────────────────────────────────────────

  it('returns empty items and null cursor when no results', async () => {
    mockModel.findMany.mockResolvedValue([]);

    const result = await cursorPaginate({
      model: mockModel,
      limit: 10,
      query: {},
    });

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  // ── Single item ───────────────────────────────────────────────────────────

  it('returns single item with no next cursor', async () => {
    mockModel.findMany.mockResolvedValue([{ id: 99 }]);

    const result = await cursorPaginate({
      model: mockModel,
      limit: 10,
      query: {},
    });

    expect(result.items).toEqual([{ id: 99 }]);
    expect(result.nextCursor).toBeNull();
  });

  // ── Merges query params ───────────────────────────────────────────────────

  it('merges extra query params (where, orderBy, include) into findMany call', async () => {
    mockModel.findMany.mockResolvedValue([]);

    await cursorPaginate({
      model: mockModel,
      limit: 5,
      query: { where: { deleted: false }, orderBy: { id: 'desc' } },
    });

    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deleted: false },
        orderBy: { id: 'desc' },
      }),
    );
  });

  // ── Boundary: limit = 1 ───────────────────────────────────────────────────

  it('works with limit=1 and a next page', async () => {
    mockModel.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]); // 2 items returned for limit+1=2

    const result = await cursorPaginate({
      model: mockModel,
      limit: 1,
      query: {},
    });

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe(2);
  });

  // ── Explicit null cursor ──────────────────────────────────────────────────

  it('treats cursor=null the same as no cursor (skip=0, no cursor arg)', async () => {
    mockModel.findMany.mockResolvedValue([{ id: 1 }]);

    await cursorPaginate({ model: mockModel, limit: 5, cursor: null, query: {} });

    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, cursor: undefined }),
    );
  });

  // ── String cursor coercion ────────────────────────────────────────────────

  it('coerces a string cursor to a number', async () => {
    // The implementation does Number(cursor) — verify a string "4" is handled
    mockModel.findMany.mockResolvedValue([{ id: 5 }]);

    await cursorPaginate({ model: mockModel, limit: 5, cursor: '4' as any, query: {} });

    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: 4 }, skip: 1 }),
    );
  });
});
