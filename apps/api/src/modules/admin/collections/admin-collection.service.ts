import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { UpdateCollectionDto } from '../../collections/dto/update-collection.dto';
import {
  CollectionSearchDto,
  CollectionSearchFields,
} from '../../collections/dto/search-collection.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import { AdminService } from '../admin.service';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { normalizeBulkIds } from 'src/common/admin/bulk-ids';

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
      throw new AlreadyDeletedException('Collection was already deleted');
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

  async restore(collectionId: number, adminId: number) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        name: true,
        creator: { select: { id: true } },
        deleted: true,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const restored = await this.prisma.collection.update({
      where: { id: collectionId },
      data: { deleted: false, deletedAt: null },
      select: DEFAULT_COLLECTION_SELECT,
    });

    // Log the restoration
    await this.adminService.log({
      adminId,
      action: 'COLLECTION_RESTORED',
      resource: 'COLLECTION',
      resourceId: collectionId.toString(),
      targetId: collection.creator.id,
      description: `Admin restored collection "${collection.name}"`,
    });

    return restored;
  }

  async bulkDelete(ids: number[], adminId: number) {
    const uniqueIds = normalizeBulkIds(ids);
    if (uniqueIds.length === 0) {
      return { affected: 0, skipped: 0 };
    }

    const result = await this.prisma.collection.updateMany({
      where: { id: { in: uniqueIds }, deleted: false },
      data: { deleted: true, deletedAt: new Date() },
    });

    if (result.count > 0) {
      await this.adminService.log({
        adminId,
        action: 'COLLECTIONS_BULK_DELETED',
        resource: 'COLLECTION',
        description: `Admin bulk soft-deleted ${result.count} collection(s)`,
        changes: { ids: uniqueIds, affected: result.count },
      });
    }

    return {
      affected: result.count,
      skipped: uniqueIds.length - result.count,
    };
  }

  async bulkRestore(ids: number[], adminId: number) {
    const uniqueIds = normalizeBulkIds(ids);
    if (uniqueIds.length === 0) {
      return { affected: 0, skipped: 0 };
    }

    const result = await this.prisma.collection.updateMany({
      where: { id: { in: uniqueIds }, deleted: true },
      data: { deleted: false, deletedAt: null },
    });

    if (result.count > 0) {
      await this.adminService.log({
        adminId,
        action: 'COLLECTIONS_BULK_RESTORED',
        resource: 'COLLECTION',
        description: `Admin bulk restored ${result.count} collection(s)`,
        changes: { ids: uniqueIds, affected: result.count },
      });
    }

    return {
      affected: result.count,
      skipped: uniqueIds.length - result.count,
    };
  }
}
