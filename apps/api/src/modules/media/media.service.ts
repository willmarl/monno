import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';
import { FilePresetName } from '../../common/file-processing/file-upload-presets';

/** Generic FK filter — e.g. { articleId: 5 } or { postId: 3 } */
type ResourceWhere = Record<string, number>;

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private fileProcessing: FileProcessingService,
  ) {}

  /**
   * Upload multiple files at once, enforcing the total cap as a batch.
   */
  async addMediaBatch(params: {
    resourceWhere?: ResourceWhere; // e.g. { articleId: 5 } or { postId: 3 }
    files: any[];
    userId: number;
    maxCount?: number; // set by caller — each resource defines its own limit
    preset?: FilePresetName; // optional override — auto-detected from mimeType if omitted
  }) {
    const { resourceWhere, files, userId, maxCount, preset } = params;

    if (resourceWhere && maxCount !== undefined) {
      const current = await this.prisma.media.count({ where: resourceWhere as any });
      if (current + files.length > maxCount) {
        throw new BadRequestException(
          `Cannot add ${files.length} file(s): already has ${current} and the limit is ${maxCount}`,
        );
      }
    }

    return Promise.all(files.map(f => this.addMedia({ resourceWhere, file: f, userId, preset })));
  }

  /**
   * Upload and attach a single media item. Internal — called by addMediaBatch.
   * Preset is auto-detected from mimeType — never comes from user input.
   */
  private async addMedia(params: {
    resourceWhere?: ResourceWhere;
    file: any;
    userId: number;
    preset?: FilePresetName; // internal use only — not exposed via DTOs
  }) {
    const { resourceWhere, file, userId } = params;

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const preset = params.preset ?? this.detectPreset(file.mimetype);

    let original: string;
    try {
      original = await this.fileProcessing.processFile(file, preset, userId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to process file';
      throw new BadRequestException(msg);
    }

    const sortOrder = await this.nextSortOrder(resourceWhere);

    return this.prisma.media.create({
      data: {
        original,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sortOrder,
        ...(resourceWhere ?? {}),
      } as any,
    });
  }

  /**
   * Replace an existing media item. Preserves sortOrder and isPrimary.
   */
  async replaceMedia(mediaId: number, file: any, userId: number, preset?: FilePresetName) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const existing = await this.getMediaOrThrow(mediaId);

    const existingCategory = this.getCategory(existing.mimeType);
    const newCategory = this.getCategory(file.mimetype);
    if (existingCategory !== newCategory) {
      throw new BadRequestException(
        `Cannot replace a ${existingCategory} with a ${newCategory}`,
      );
    }

    const resolvedPreset = preset ?? this.detectPreset(file.mimetype);

    let original: string;
    try {
      original = await this.fileProcessing.processFile(file, resolvedPreset, userId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to process file';
      throw new BadRequestException(msg);
    }

    await this.fileProcessing.deleteFile(existing.original);
    if (existing.thumbnail) {
      await this.fileProcessing.deleteFile(existing.thumbnail);
    }

    return this.prisma.media.update({
      where: { id: mediaId },
      data: {
        original,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        thumbnail: null,
      },
    });
  }

  /**
   * Delete a media item and remove its files from storage.
   */
  async removeMedia(mediaId: number) {
    const media = await this.getMediaOrThrow(mediaId);

    await this.fileProcessing.deleteFile(media.original);
    if (media.thumbnail) {
      await this.fileProcessing.deleteFile(media.thumbnail);
    }

    await this.prisma.media.delete({ where: { id: mediaId } });
  }

  /**
   * Mark one media item as primary for a resource, clearing all others.
   */
  async setPrimary(resourceWhere: ResourceWhere, mediaId: number) {
    await this.prisma.$transaction([
      this.prisma.media.updateMany({
        where: resourceWhere as any,
        data: { isPrimary: false },
      }),
      this.prisma.media.update({
        where: { id: mediaId },
        data: { isPrimary: true },
      }),
    ]);

    return this.prisma.media.findUnique({ where: { id: mediaId } });
  }

  /**
   * Reorder media by providing all IDs in desired display order.
   * All provided IDs must belong to the given resource.
   */
  async reorderMedia(resourceWhere: ResourceWhere, orderedIds: number[]) {
    if (!orderedIds?.length) {
      throw new BadRequestException('ids must be a non-empty array');
    }

    const existing = await this.prisma.media.findMany({
      where: resourceWhere as any,
      select: { id: true },
    });

    if (!existing.length) {
      throw new BadRequestException('This resource has no media to reorder');
    }

    const existingIds = new Set(existing.map((m) => m.id));
    const invalid = orderedIds.filter((id) => !existingIds.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Media IDs not found for this resource: ${invalid.join(', ')}`,
      );
    }

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.media.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  /**
   * Fetch a media record by ID, throwing NotFoundException if missing.
   * Used by resource services to verify ownership before delegating.
   */
  async getMediaOrThrow(mediaId: number) {
    if (!mediaId || isNaN(mediaId)) {
      throw new BadRequestException('Invalid media ID');
    }
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  private getCategory(mimeType: string): 'image' | 'video' | 'document' {
    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType?.startsWith('video/')) return 'video';
    return 'document';
  }

  private detectPreset(mimeType: string): FilePresetName {
    if (mimeType?.startsWith('image/')) return 'mediaImage';
    if (mimeType?.startsWith('video/')) return 'mediaVideo';
    return 'mediaDocument';
  }

  private async nextSortOrder(resourceWhere?: ResourceWhere): Promise<number> {
    if (!resourceWhere) return 0;
    const agg = await this.prisma.media.aggregate({
      where: resourceWhere as any,
      _max: { sortOrder: true },
    });
    return (agg._max.sortOrder ?? -1) + 1;
  }
}
