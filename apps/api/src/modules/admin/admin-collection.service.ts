import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateCollectionDto } from '../collections/dto/update-collection.dto';
import {
  CollectionSearchDto,
  CollectionSearchFields,
} from '../collections/dto/search-collection.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import { AdminService } from './admin.service';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';

const DEFAULT_COLLECTION_SELECT = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  creatorId: true,
  creator: {
    select: { id: true, username: true, avatarPath: true },
  },
  deleted: true,
  deletedAt: true,
};

@Injectable()
export class AdminCollectionService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}

  async findById(collectionId: number) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: DEFAULT_COLLECTION_SELECT,
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async search(searchDto: CollectionSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [];

    if (searchDto.deleted !== undefined) {
      filterConditions.push({ deleted: searchDto.deleted });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.collection,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
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

  async update(
    collectionId: number,
    data: UpdateCollectionDto,
    adminId: number,
  ) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('COLLECTION not found');
    }

    const updated = await this.prisma.collection.update({
      where: { id: collectionId },
      data,
      select: DEFAULT_COLLECTION_SELECT,
    });

    // Log the update
    await this.adminService.log({
      adminId,
      action: 'COLLECTION_UPDATED',
      resource: 'COLLECTION',
      resourceId: collectionId.toString(),
      targetId: collection.creatorId,
      description: `Admin updated collection "${collection.name}"`,
    });

    return updated;
  }

  async delete(collectionId: number, adminId: number, reason?: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: { name: true, creatorId: true, deleted: true },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.deleted) {
      return { message: 'Collection was already deleted' };
    }

    const deleted = await this.prisma.collection.update({
      where: { id: collectionId },
      data: { deleted: true, deletedAt: new Date() },
      select: DEFAULT_COLLECTION_SELECT,
    });

    // Log the deletion
    await this.adminService.log({
      adminId,
      action: 'COLLECTION_DELETED',
      resource: 'COLLECTION',
      resourceId: collectionId.toString(),
      targetId: collection.creatorId,
      description: `Admin deleted collection "${collection.name}"`,
    });

    return deleted;
  }
}
