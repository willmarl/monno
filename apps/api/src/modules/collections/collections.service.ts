import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddCollectionItemDto } from './dto/add-collection-item.dto';
import { RemoveCollectionItemDto } from './dto/remove-collection-item.dto';
import type { CollectableResourceType } from 'src/common/types/resource.types';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';

const DEFAULT_COLLECTION_SELECT = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
};

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a collection for a user
   */
  async create(userId: number, data: CreateCollectionDto) {
    // Check if user already has a non-deleted collection with this name
    const existing = await this.prisma.collection.findFirst({
      where: {
        creatorId: userId,
        name: data.name,
        deleted: false,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Collection "${data.name}" already exists for this user`,
      );
    }

    return this.prisma.collection.create({
      data: {
        creatorId: userId,
        ...data,
      },
      select: DEFAULT_COLLECTION_SELECT,
    });
  }

  /**
   * Get all collections for a user (excluding soft-deleted)
   */
  async findAllByUserId(userId: number, pag: PaginationDto) {
    const where = { creatorId: userId, deleted: false };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.collection,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' } as const,
        select: DEFAULT_COLLECTION_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  /**
   * Get a specific collection with its items (public, excluding soft-deleted)
   */
  async findOne(collectionId: number, pag?: PaginationDto) {
    const limit = pag?.limit ?? 10;
    const offset = pag?.offset ?? 0;

    // Get total count of non-deleted items
    const totalItemCount = await this.prisma.collectionItem.count({
      where: { collectionId, deleted: false },
    });

    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        ...DEFAULT_COLLECTION_SELECT,
        deleted: true,
        items: {
          where: { deleted: false },
          select: {
            id: true,
            resourceType: true,
            resourceId: true,
            addedAt: true,
          },
          orderBy: { addedAt: 'desc' } as const,
          skip: offset,
          take: limit,
        },
      },
    });

    if (!collection || collection.deleted) {
      throw new NotFoundException('Collection not found');
    }

    // Remove the deleted flag from response
    const { deleted, ...result } = collection;

    return {
      ...result,
      itemsPageInfo: {
        total: totalItemCount,
        limit,
        offset,
        hasMore: offset + limit < totalItemCount,
      },
    };
  }

  /**
   * Get collection by ID and user ID (excluding soft-deleted)
   */
  async getByIdAndUserId(collectionId: number, userId: number) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.deleted) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.creatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this collection',
      );
    }

    return collection;
  }

  /**
   * Update a collection
   */
  async update(
    userId: number,
    collectionId: number,
    data: UpdateCollectionDto,
  ) {
    await this.getByIdAndUserId(collectionId, userId);

    // If updating name, check for duplicates (non-deleted)
    if (data.name) {
      const existing = await this.prisma.collection.findFirst({
        where: {
          creatorId: userId,
          name: data.name,
          deleted: false,
        },
      });

      if (existing && existing.id !== collectionId) {
        throw new BadRequestException(
          `Collection "${data.name}" already exists for this user`,
        );
      }
    }

    return this.prisma.collection.update({
      where: { id: collectionId },
      data,
      select: DEFAULT_COLLECTION_SELECT,
    });
  }

  /**
   * Soft delete a collection
   */
  async remove(userId: number, collectionId: number) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.creatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this collection',
      );
    }

    if (collection.deleted) {
      return { message: 'Collection was already deleted' };
    }

    return this.prisma.collection.update({
      where: { id: collectionId },
      data: { deleted: true, deletedAt: new Date() },
      select: DEFAULT_COLLECTION_SELECT,
    });
  }

  /**
   * Add an item to a collection
   */
  async addItem(
    userId: number,
    collectionId: number,
    data: AddCollectionItemDto,
  ) {
    await this.getByIdAndUserId(collectionId, userId);

    // Validate that the resource exists
    await this.validateResourceExists(data.resourceType, data.resourceId);

    // Check if item already exists and is not deleted in collection
    const existing = await this.prisma.collectionItem.findFirst({
      where: {
        collectionId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        deleted: false,
      },
    });

    if (existing) {
      throw new BadRequestException('This item is already in the collection');
    }

    // If item was previously deleted, restore it
    const previouslyDeleted = await this.prisma.collectionItem.findUnique({
      where: {
        collectionId_resourceType_resourceId: {
          collectionId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
        },
      },
    });

    if (previouslyDeleted && previouslyDeleted.deleted) {
      return this.prisma.collectionItem.update({
        where: {
          collectionId_resourceType_resourceId: {
            collectionId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
          },
        },
        data: { deleted: false, deletedAt: null },
        select: {
          id: true,
          resourceType: true,
          resourceId: true,
          addedAt: true,
        },
      });
    }

    return this.prisma.collectionItem.create({
      data: {
        collectionId,
        ...data,
      },
      select: {
        id: true,
        resourceType: true,
        resourceId: true,
        addedAt: true,
      },
    });
  }

  /**
   * Soft delete an item from a collection
   */
  async removeItem(
    userId: number,
    collectionId: number,
    data: RemoveCollectionItemDto,
  ) {
    await this.getByIdAndUserId(collectionId, userId);

    const item = await this.prisma.collectionItem.findFirst({
      where: {
        collectionId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        deleted: false,
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found in collection');
    }

    return this.prisma.collectionItem.update({
      where: { id: item.id },
      data: { deleted: true, deletedAt: new Date() },
      select: {
        id: true,
        resourceType: true,
        resourceId: true,
      },
    });
  }

  /**
   * Validate that a resource exists based on type
   */
  private async validateResourceExists(
    resourceType: CollectableResourceType,
    resourceId: number,
  ): Promise<void> {
    switch (resourceType) {
      case 'POST':
        const post = await this.prisma.post.findUnique({
          where: { id: resourceId },
        });
        if (!post || post.deleted) {
          throw new NotFoundException('Post not found or has been deleted');
        }
        break;

      // case 'COMMENT':
      //   const comment = await this.prisma.comment.findUnique({
      //     where: { id: resourceId },
      //   });
      //   if (!comment || comment.deleted) {
      //     throw new NotFoundException('Comment not found or has been deleted');
      //   }
      //   break;

      // case 'VIDEO':
      //   // TODO: Implement video validation when Video model is added
      //   // For now, we'll assume video exists
      //   break;

      // case 'ARTICLE':
      //   // TODO: Implement article validation when Article model is added
      //   // For now, we'll assume article exists
      //   break;
    }
  }

  /**
   * Create default "favorites" collection for a new user
   * This is called during user creation
   */
  async createDefaultFavoritesCollection(userId: number) {
    return this.prisma.collection.create({
      data: {
        creatorId: userId,
        name: 'favorites',
        description: 'Your favorite posts, videos, and articles',
      },
    });
  }
}
