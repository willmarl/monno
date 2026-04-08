import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offsetPaginate } from './offset-pagination';

describe('offsetPaginate', () => {
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      count: vi.fn(),
      findMany: vi.fn(),
    };
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('returns items and pageInfo for a standard first page', async () => {
    mockModel.count.mockResolvedValue(25);
    mockModel.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 10,
      offset: 0,
      query: { orderBy: { id: 'desc' } },
    });

    expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.pageInfo.totalItems).toBe(25);
    expect(result.pageInfo.hasNext).toBe(true);
    expect(result.pageInfo.hasPrev).toBe(false);
    expect(result.pageInfo.nextOffset).toBe(10);
    expect(result.pageInfo.prevOffset).toBeNull();
    expect(result.isRedirected).toBe(false);
  });

  it('calls findMany with correct skip and take', async () => {
    mockModel.count.mockResolvedValue(50);
    mockModel.findMany.mockResolvedValue([]);

    await offsetPaginate({ model: mockModel, limit: 10, offset: 20, query: {} });

    expect(mockModel.findMany).toHaveBeenCalledWith({
      skip: 20,
      take: 10,
    });
  });

  it('sets hasPrev=true and prevOffset on a middle page', async () => {
    mockModel.count.mockResolvedValue(30);
    mockModel.findMany.mockResolvedValue([]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 10,
      offset: 10,
      query: {},
    });

    expect(result.pageInfo.hasPrev).toBe(true);
    expect(result.pageInfo.prevOffset).toBe(0);
    expect(result.pageInfo.hasNext).toBe(true);
  });

  it('sets hasNext=false on the last page', async () => {
    mockModel.count.mockResolvedValue(20);
    mockModel.findMany.mockResolvedValue([{ id: 11 }, { id: 12 }]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 10,
      offset: 10,
      query: {},
    });

    expect(result.pageInfo.hasNext).toBe(false);
    expect(result.pageInfo.nextOffset).toBeNull();
  });

  // ── Empty results ────────────────────────────────────────────────────────

  it('handles empty result set', async () => {
    mockModel.count.mockResolvedValue(0);
    mockModel.findMany.mockResolvedValue([]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 10,
      offset: 0,
      query: {},
    });

    expect(result.items).toEqual([]);
    expect(result.pageInfo.totalItems).toBe(0);
    expect(result.pageInfo.hasNext).toBe(false);
    expect(result.pageInfo.hasPrev).toBe(false);
    expect(result.isRedirected).toBe(false);
  });

  // ── Boundary: page size = 1 ───────────────────────────────────────────────

  it('works with page size of 1', async () => {
    mockModel.count.mockResolvedValue(3);
    mockModel.findMany.mockResolvedValue([{ id: 2 }]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 1,
      offset: 1,
      query: {},
    });

    expect(result.pageInfo.hasNext).toBe(true);
    expect(result.pageInfo.hasPrev).toBe(true);
    expect(result.pageInfo.nextOffset).toBe(2);
    expect(result.pageInfo.prevOffset).toBe(0);
  });

  // ── Out-of-bounds redirect ────────────────────────────────────────────────

  it('redirects to last page when offset is out of bounds', async () => {
    mockModel.count.mockResolvedValue(15); // 2 pages of 10
    mockModel.findMany.mockResolvedValue([{ id: 11 }]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 10,
      offset: 999,
      query: {},
    });

    expect(result.isRedirected).toBe(true);
    expect(result.requestedOffset).toBe(999);
    // Corrected offset = floor((15 - 1) / 10) * 10 = 10
    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('does NOT redirect when offset is exactly at last page start', async () => {
    mockModel.count.mockResolvedValue(10);
    mockModel.findMany.mockResolvedValue([{ id: 1 }]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 10,
      offset: 0,
      query: {},
    });

    expect(result.isRedirected).toBe(false);
  });

  // ── OOB boundary values ───────────────────────────────────────────────────

  it('does NOT redirect when offset is totalItems - 1 (last valid offset)', async () => {
    // BV: one below the OOB trigger (offset >= totalItems)
    mockModel.count.mockResolvedValue(20);
    mockModel.findMany.mockResolvedValue([{ id: 20 }]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 10,
      offset: 19, // totalItems - 1 = 19, still in bounds
      query: {},
    });

    expect(result.isRedirected).toBe(false);
  });

  it('redirects when offset equals totalItems exactly (first OOB value)', async () => {
    // BV: exact OOB trigger — offset === totalItems
    mockModel.count.mockResolvedValue(20);
    mockModel.findMany.mockResolvedValue([{ id: 11 }]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 10,
      offset: 20, // offset === totalItems → OOB
      query: {},
    });

    expect(result.isRedirected).toBe(true);
    expect(result.requestedOffset).toBe(20);
  });

  it('does NOT redirect when totalItems is 0 even with large offset', async () => {
    // EP: empty dataset — the (totalItems > 0) guard prevents redirect
    mockModel.count.mockResolvedValue(0);
    mockModel.findMany.mockResolvedValue([]);

    const result = await offsetPaginate({
      model: mockModel,
      limit: 10,
      offset: 999,
      query: {},
    });

    expect(result.isRedirected).toBe(false);
    expect(result.pageInfo.totalItems).toBe(0);
  });
});
