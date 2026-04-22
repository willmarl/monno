# Guide: Adding Media Collection to a Resource (e.g. Post)

Use this guide when a resource needs a **managed media array** — multiple files, reordering, replace/remove per item, and category enforcement (can't replace a video with an image).

For simple single-file uploads that just return a URL (e.g. avatarPath, logoPath), use `guide/how-to-do-file-upload.md` instead.

---

## When to use MediaService vs FileProcessingService directly

| Scenario | Use |
|---|---|
| Store one image URL on a model field (`avatarPath`) | `FileProcessingService` directly (simple guide) |
| Attach a collection of files to a resource | `MediaService` (this guide) |
| Multiple files, reorder, replace, remove per item | `MediaService` (this guide) |

---

## What you get for free from MediaService

- `addMediaBatch` — upload multiple files, enforces your resource's limit as a batch
- `replaceMedia` — category-safe replacement (can't replace a video with an image)
- `removeMedia` — deletes file from storage + DB record
- `setPrimary` — mark one item as featured (e.g. video poster image)
- `reorderMedia` — send IDs in desired order, backend assigns sortOrder

---

## Step 1: Add FK to the `Media` model in Prisma schema

**File:** `apps/api/prisma/schema.prisma`

```prisma
model Media {
  // ...existing fields...

  article   Article? @relation(fields: [articleId], references: [id], onDelete: Cascade)
  articleId Int?

  post   Post? @relation(fields: [postId], references: [id], onDelete: Cascade) // <- ADD
  postId Int?                                                                     // <- ADD

  @@index([articleId])
  @@index([postId]) // <- ADD
}
```

## Step 2: Add the relation to your resource model

```prisma
model Post {
  // ...existing fields...
  media Media[] // <- ADD
}
```

## Step 3: Run migration

```bash
cd apps/api && pnpm prisma migrate dev --name add-media-to-posts
```

---

## Step 4: Import MediaModule into your resource module

**File:** `apps/api/src/modules/posts/posts.module.ts`

```typescript
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule], // <- ADD (replaces or alongside FileProcessingModule)
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
})
export class PostsModule {}
```

---

## Step 5: Inject MediaService and define the limit

**File:** `apps/api/src/modules/posts/posts.service.ts`

```typescript
import { MediaService } from '../media/media.service';

const POST_MEDIA_LIMIT = 5; // your resource defines its own limit

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) {}
```

---

## Step 6: Add delegation methods (~5 lines each)

`MediaService` is fully generic — no changes needed there. Pass your resource's FK as `resourceWhere: { postId }`. The service handles the rest.

```typescript
async addMediaBatch(postId: number, files: any[], userId: number) {
  return this.mediaService.addMediaBatch({ resourceWhere: { postId }, files, userId, maxCount: POST_MEDIA_LIMIT });
}

async replaceMedia(postId: number, mediaId: number, file: any, userId: number) {
  const media = await this.mediaService.getMediaOrThrow(mediaId);
  if (media.postId !== postId) throw new NotFoundException('Media not found');
  return this.mediaService.replaceMedia(mediaId, file, userId);
}

async removeMedia(postId: number, mediaId: number) {
  const media = await this.mediaService.getMediaOrThrow(mediaId);
  if (media.postId !== postId) throw new NotFoundException('Media not found');
  return this.mediaService.removeMedia(mediaId);
}

async setPrimary(postId: number, mediaId: number) {
  const media = await this.mediaService.getMediaOrThrow(mediaId);
  if (media.postId !== postId) throw new NotFoundException('Media not found');
  return this.mediaService.setPrimary({ postId }, mediaId);
}

async reorderMedia(postId: number, ids: number[]) {
  return this.mediaService.reorderMedia({ postId }, ids);
}
```

---

## Step 7: Add media sub-routes to controller

**File:** `apps/api/src/modules/posts/posts.controller.ts`

```typescript
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ReorderMediaDto } from './dto/reorder-media.dto';

// Note: literal routes (reorder, :mediaId/primary) must be declared
// BEFORE parameterized routes (:mediaId) or NestJS will treat "reorder"
// as a mediaId param.

@UseGuards(JwtAccessGuard, CreatorGuard)
@ProtectedResource('post')
@UseInterceptors(FilesInterceptor('files', 10))
@Post(':id/media')
addMedia(@Param('id', ParseIntPipe) id: number, @Req() req, @UploadedFiles() files: any[]) {
  if (!files?.length) throw new BadRequestException('At least one file required');
  return this.postsService.addMediaBatch(id, files, req.user.sub);
}

@UseGuards(JwtAccessGuard, CreatorGuard)
@ProtectedResource('post')
@Patch(':id/media/reorder')
reorderMedia(@Param('id', ParseIntPipe) id: number, @Body() dto: ReorderMediaDto) {
  return this.postsService.reorderMedia(id, dto.ids);
}

@UseGuards(JwtAccessGuard, CreatorGuard)
@ProtectedResource('post')
@Patch(':id/media/:mediaId/primary')
setPrimary(@Param('id', ParseIntPipe) id: number, @Param('mediaId', ParseIntPipe) mediaId: number) {
  return this.postsService.setPrimary(id, mediaId);
}

@UseGuards(JwtAccessGuard, CreatorGuard)
@ProtectedResource('post')
@UseInterceptors(FileInterceptor('file'))
@Patch(':id/media/:mediaId')
replaceMedia(
  @Param('id', ParseIntPipe) id: number,
  @Param('mediaId', ParseIntPipe) mediaId: number,
  @Req() req,
  @UploadedFile() file: any,
) {
  return this.postsService.replaceMedia(id, mediaId, file, req.user.sub);
}

@UseGuards(JwtAccessGuard, CreatorGuard)
@ProtectedResource('post')
@Delete(':id/media/:mediaId')
@HttpCode(204)
removeMedia(@Param('id', ParseIntPipe) id: number, @Param('mediaId', ParseIntPipe) mediaId: number) {
  return this.postsService.removeMedia(id, mediaId);
}
```

---

## Step 8: Add `media` to DEFAULT select

In your resource service's select constant:

```typescript
const DEFAULT_POST_SELECT = {
  // ...existing fields...
  media: {
    select: {
      id: true,
      original: true,
      thumbnail: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
      isPrimary: true,
      createdAt: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
};
```

---

## Step 9: Copy ReorderMediaDto

**File:** `apps/api/src/modules/posts/dto/reorder-media.dto.ts`

```typescript
import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class ReorderMediaDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids!: number[];
}
```

---

## Step 10: Register resource in the orphaned media cleanup

**File:** `apps/worker/src/scripts/media-cleanup-resources.ts`

When an article/post/etc. is soft-deleted, its media files linger in storage until the cleanup job runs. Add your resource here so the worker knows to clean it up.

```typescript
{
  label: 'post',
  getOrphaned: (cutoff) =>
    (prisma as any).post.findMany({
      where: { deleted: true, deletedAt: { lt: cutoff }, media: { some: {} } },
      select: { id: true, media: { select: { id: true, original: true, thumbnail: true } } },
    }),
  deleteMediaRecords: (postId) =>
    (prisma as any).media.deleteMany({ where: { postId } }),
},
```

> Note: this assumes your resource has a `deleted: Boolean` and `deletedAt: DateTime?` field (soft-delete pattern). If your resource is hard-deleted instead, its media records are removed automatically via the `onDelete: Cascade` FK — no cleanup entry needed.

---

## Done — endpoints you now have

```
POST   /posts/:id/media                  multipart key: "files" (1–10 files)
PATCH  /posts/:id/media/reorder          body: { "ids": [3, 1, 2] }
PATCH  /posts/:id/media/:mediaId/primary (no body)
PATCH  /posts/:id/media/:mediaId         multipart key: "file" (1 file, same category only)
DELETE /posts/:id/media/:mediaId
```

## Adding a new file type later

If you need to accept a new file type (e.g. `.zip`, `.docx`):
1. Add a preset to `file-upload-presets.ts` with the MIME type and size limit
2. `RawFileProcessor` handles saving it — no new processor needed unless you want transformation
3. For transformation (e.g. video compression), follow `guide/how-to-do-file-upload.md` steps 2–4

---

## Restricting allowed file types (validation)

No Zod or custom validators needed. Add a MIME check in your resource service's `addMediaBatch` and `replaceMedia` before delegating to `MediaService`. Resource-specific rules live in the resource service — `MediaService` stays generic.

**Example: images only**

```typescript
// posts.service.ts
async addMediaBatch(postId: number, files: any[], userId: number) {
  const invalid = files.filter(f => !f.mimetype?.startsWith('image/'));
  if (invalid.length) {
    throw new BadRequestException('Posts only accept image files');
  }
  return this.mediaService.addMediaBatch({ resourceWhere: { postId }, files, userId, maxCount: POST_MEDIA_LIMIT });
}

async replaceMedia(postId: number, mediaId: number, file: any, userId: number) {
  if (!file.mimetype?.startsWith('image/')) {
    throw new BadRequestException('Posts only accept image files');
  }
  const media = await this.mediaService.getMediaOrThrow(mediaId);
  if (media.postId !== postId) throw new NotFoundException('Media not found');
  return this.mediaService.replaceMedia(mediaId, file, userId);
}
```

**Common MIME checks**

| Want to allow | Check |
|---|---|
| Images only | `f.mimetype?.startsWith('image/')` |
| Videos only | `f.mimetype?.startsWith('video/')` |
| Images + videos | `f.mimetype?.startsWith('image/') \|\| f.mimetype?.startsWith('video/')` |
| Specific types | `['image/jpeg', 'image/png'].includes(f.mimetype)` |

> `FileProcessingService` also validates MIME against the preset's `allowedMimeTypes` as a second layer — so even if your check passes, unsupported formats (e.g. `image/tiff`) are still rejected downstream.
