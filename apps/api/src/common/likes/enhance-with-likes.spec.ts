import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { enhanceWithLikes } from './enhance-with-likes';

describe('enhanceWithLikes', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      like: {
        findUnique: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── No currentUserId ─────────────────────────────────────────────────────

  it('sets likedByMe=false for all items when no userId is provided', async () => {
    const items = [{ id: 1, likeCount: 5 }, { id: 2, likeCount: 2 }];

    const result = await enhanceWithLikes(mockPrisma, 'POST', items);

    expect(result).toEqual([
      { id: 1, likeCount: 5, likedByMe: false },
      { id: 2, likeCount: 2, likedByMe: false },
    ]);
    expect(mockPrisma.like.findUnique).not.toHaveBeenCalled();
  });

  it('does not query the DB when no userId is provided', async () => {
    await enhanceWithLikes(mockPrisma, 'POST', [{ id: 1 }]);
    expect(mockPrisma.like.findUnique).not.toHaveBeenCalled();
  });

  // ── With currentUserId ────────────────────────────────────────────────────

  it('sets likedByMe=true when user has liked the item', async () => {
    mockPrisma.like.findUnique.mockResolvedValue({ id: 10 }); // like record exists

    const result = await enhanceWithLikes(mockPrisma, 'POST', [{ id: 1 }], 42);

    expect(result[0].likedByMe).toBe(true);
  });

  it('sets likedByMe=false when user has not liked the item', async () => {
    mockPrisma.like.findUnique.mockResolvedValue(null); // no like record

    const result = await enhanceWithLikes(mockPrisma, 'POST', [{ id: 1 }], 42);

    expect(result[0].likedByMe).toBe(false);
  });

  it('queries with the correct composite key', async () => {
    mockPrisma.like.findUnique.mockResolvedValue(null);

    await enhanceWithLikes(mockPrisma, 'POST', [{ id: 7 }], 99);

    expect(mockPrisma.like.findUnique).toHaveBeenCalledWith({
      where: {
        userId_resourceType_resourceId: {
          userId: 99,
          resourceType: 'POST',
          resourceId: 7,
        },
      },
    });
  });

  it('queries once per item', async () => {
    mockPrisma.like.findUnique.mockResolvedValue(null);

    await enhanceWithLikes(mockPrisma, 'POST', [{ id: 1 }, { id: 2 }, { id: 3 }], 5);

    expect(mockPrisma.like.findUnique).toHaveBeenCalledTimes(3);
  });

  // ── Mixed liked/not liked ─────────────────────────────────────────────────

  it('handles a mix of liked and not-liked items correctly', async () => {
    mockPrisma.like.findUnique
      .mockResolvedValueOnce({ id: 1 })  // item 1: liked
      .mockResolvedValueOnce(null)         // item 2: not liked
      .mockResolvedValueOnce({ id: 3 }); // item 3: liked

    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = await enhanceWithLikes(mockPrisma, 'POST', items, 10);

    expect(result[0].likedByMe).toBe(true);
    expect(result[1].likedByMe).toBe(false);
    expect(result[2].likedByMe).toBe(true);
  });

  // ── Empty array ───────────────────────────────────────────────────────────

  it('returns an empty array when given an empty array', async () => {
    const result = await enhanceWithLikes(mockPrisma, 'POST', [], 1);
    expect(result).toEqual([]);
    expect(mockPrisma.like.findUnique).not.toHaveBeenCalled();
  });

  // ── Preserves existing fields ─────────────────────────────────────────────

  it('preserves all existing fields on each item', async () => {
    mockPrisma.like.findUnique.mockResolvedValue(null);

    const item = { id: 1, title: 'Test', likeCount: 7, viewCount: 100 };
    const result = await enhanceWithLikes(mockPrisma, 'POST', [item], 5);

    expect(result[0]).toMatchObject({ id: 1, title: 'Test', likeCount: 7, viewCount: 100, likedByMe: false });
  });

  // ── Resource types (EP: one test per valid enum value) ───────────────────

  it('works with COMMENT resource type', async () => {
    mockPrisma.like.findUnique.mockResolvedValue({ id: 50 });

    const result = await enhanceWithLikes(mockPrisma, 'COMMENT', [{ id: 3 }], 1);

    expect(result[0].likedByMe).toBe(true);
    expect(mockPrisma.like.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId_resourceType_resourceId: expect.objectContaining({ resourceType: 'COMMENT' }) }),
      }),
    );
  });

  it('works with ARTICLE resource type', async () => {
    mockPrisma.like.findUnique.mockResolvedValue(null);

    const result = await enhanceWithLikes(mockPrisma, 'ARTICLE', [{ id: 9 }], 1);

    expect(result[0].likedByMe).toBe(false);
    expect(mockPrisma.like.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId_resourceType_resourceId: expect.objectContaining({ resourceType: 'ARTICLE' }) }),
      }),
    );
  });

  // ── currentUserId boundary ────────────────────────────────────────────────

  it('treats currentUserId=0 as no user (0 is falsy — no DB query)', async () => {
    // BV: 0 is the boundary between "no user" and "valid user id"
    // The implementation checks `if (currentUserId)` so 0 === no user
    const result = await enhanceWithLikes(mockPrisma, 'POST', [{ id: 1 }], 0);

    expect(result[0].likedByMe).toBe(false);
    expect(mockPrisma.like.findUnique).not.toHaveBeenCalled();
  });
});
