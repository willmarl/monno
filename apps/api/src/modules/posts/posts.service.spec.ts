import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';

describe('PostsService', () => {
  let service: PostsService;
  let mockPrisma: any;

  beforeEach(() => {
    // Create a mock PrismaService
    mockPrisma = {
      post: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      like: {
        count: vi.fn().mockResolvedValue(0),
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };

    // Create PostsService with the mocked Prisma
    service = new PostsService(mockPrisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a post with creatorId', async () => {
      // ARRANGE
      const createPostDto = {
        title: 'Test Post',
        content: 'Test content',
      };
      const userId = 1;

      const createdPost = {
        id: 1,
        title: 'Test Post',
        content: 'Test content',
        creatorId: userId,
        createdAt: new Date(),
      };

      mockPrisma.post.create.mockResolvedValue(createdPost);

      // ACT
      const result = await service.create(createPostDto, userId);

      // ASSERT
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Post',
          content: 'Test content',
          creatorId: userId,
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(createdPost);
    });

    it('should create a post with additional fields', async () => {
      // ARRANGE
      const createPostDto = {
        title: 'Test Post',
        content: 'Test content',
      };
      const userId = 1;

      mockPrisma.post.create.mockResolvedValue({
        id: 1,
        ...createPostDto,
        creatorId: userId,
      });

      // ACT
      await service.create(createPostDto, userId);

      // ASSERT
      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatorId: userId,
            title: 'Test Post',
            content: 'Test content',
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a post by id with enhanced likes info', async () => {
      // ARRANGE
      const post = {
        id: 1,
        title: 'Test Post',
        content: 'Test content',
        creatorId: 1,
        deleted: false,
        viewCount: 5,
        likeCount: 3,
        creator: { id: 1, username: 'testuser', avatarPath: null },
      };

      mockPrisma.post.findUnique.mockResolvedValue(post);
      mockPrisma.like.findUnique.mockResolvedValue(null); // Current user hasn't liked

      // ACT
      const result = await service.findById(1, 2);

      // ASSERT
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.objectContaining({
          id: true,
          title: true,
          content: true,
        }),
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          title: 'Test Post',
          likeCount: 3,
          likedByMe: false,
        }),
      );
    });

    it('should include likedByMe true if current user liked the post', async () => {
      // ARRANGE
      const post = {
        id: 1,
        title: 'Test Post',
        content: 'Test content',
        deleted: false,
        creator: { id: 1, username: 'testuser', avatarPath: null },
      };

      mockPrisma.post.findUnique.mockResolvedValue(post);
      mockPrisma.like.count.mockResolvedValue(1);
      mockPrisma.like.findUnique.mockResolvedValue({ id: 1, userId: 2 }); // User 2 liked it

      // ACT
      const result = await service.findById(1, 2);

      // ASSERT
      expect(result.likedByMe).toBe(true);
    });

    it('should throw NotFoundException if post not found', async () => {
      // ARRANGE
      mockPrisma.post.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.findById(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999, 1)).rejects.toThrow('Post not found');
    });

    it('should throw NotFoundException if post is deleted', async () => {
      // ARRANGE
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 1,
        title: 'Deleted Post',
        deleted: true,
      });

      // ACT & ASSERT
      await expect(service.findById(1, 1)).rejects.toThrow(NotFoundException);
      await expect(service.findById(1, 1)).rejects.toThrow('Post not found');
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      // ARRANGE
      const updatePostDto = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const updatedPost = {
        id: 1,
        ...updatePostDto,
        creatorId: 1,
        createdAt: new Date(),
      };

      mockPrisma.post.update.mockResolvedValue(updatedPost);

      // ACT
      const result = await service.update(1, updatePostDto);

      // ASSERT
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updatePostDto,
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedPost);
    });

    it('should update only provided fields', async () => {
      // ARRANGE
      const updatePostDto = {
        title: 'New Title',
      };

      mockPrisma.post.update.mockResolvedValue({
        id: 1,
        title: 'New Title',
      });

      // ACT
      await service.update(1, updatePostDto);

      // ASSERT
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'New Title' },
        select: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should soft delete a post by setting deleted and deletedAt', async () => {
      // ARRANGE
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 1,
        deleted: false,
      });

      mockPrisma.post.update.mockResolvedValue({
        id: 1,
        deleted: true,
        deletedAt: expect.any(Date),
      });

      // ACT
      await service.remove(1);

      // ASSERT
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, deleted: true },
      });
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deleted: true, deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if post not found', async () => {
      // ARRANGE
      mockPrisma.post.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow('Post not found');
    });

    it('should throw AlreadyDeletedException if post is already deleted', async () => {
      // ARRANGE
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 1,
        deleted: true,
      });

      // ACT & ASSERT
      await expect(service.remove(1)).rejects.toThrow(AlreadyDeletedException);
      await expect(service.remove(1)).rejects.toThrow(
        'Post was already deleted',
      );
    });

    it('should not call update if post is not found', async () => {
      // ARRANGE
      mockPrisma.post.findUnique.mockResolvedValue(null);

      // ACT
      try {
        await service.remove(999);
      } catch {
        // Expected to throw
      }

      // ASSERT
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it('should not call update if post is already deleted', async () => {
      // ARRANGE
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 1,
        deleted: true,
      });

      // ACT
      try {
        await service.remove(1);
      } catch {
        // Expected to throw
      }

      // ASSERT
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });
  });
});
