# File Upload Architecture

How files move through the system — from HTTP request to storage URL in the database.

---

## The Two Concepts

There are only two things to understand:

| Concept | What it is | Where it lives |
|---|---|---|
| **Preset** | Config — what's *allowed* and *how to configure processing* | `file-upload-presets.ts` |
| **Processor** | Logic — *how to actually transform and save* the file | `processors/*.processor.ts` |

A preset never contains code. A processor never contains validation rules. They don't know about each other — `FileProcessingService` is the glue.

---

## Big Picture

```
HTTP Request (multipart file)
        │
        ▼
  ┌─────────────┐
  │  Controller │  — receives raw file via @UploadedFile / @UploadedFiles
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │   Service   │  — decides WHICH preset to use (avatar? mediaImage? mediaImagePro?)
  └──────┬──────┘
         │  processFile(file, 'presetName', userId)
         ▼
  ┌──────────────────────┐
  │ FileProcessingService│  — validates size + MIME against preset
  └──────┬───────────────┘
         │  finds processor via canHandle(mimeType)
         ▼
  ┌───────────────┐
  │   Processor   │  — transforms file (resize, convert, or raw pass-through)
  └──────┬────────┘
         │  saveFile(buffer, path, filename)
         ▼
  ┌────────────────┐
  │ StorageBackend │  — writes to local disk or S3
  └──────┬─────────┘
         │
         ▼
    returns URL string  ←  saved to DB by the caller
```

---

## How FileProcessingService Connects Preset → Processor

```
processFile(file, 'mediaImage', userId)
       │
       │  1. resolve preset config
       ▼
  ┌─────────────────────────────────────────────┐
  │ mediaImage preset                           │
  │   maxSize: 5MB                              │
  │   allowedMimeTypes: [jpeg, png, webp, gif]  │
  │   uploadPath: 'media/images'                │
  │   processingOptions: { quality: 85, ... }   │
  └──────────────┬──────────────────────────────┘
                 │  2. validate file against preset (size, MIME)
                 │     throws 400 if invalid
                 │
                 │  3. loop processors asking canHandle(mimeType)
                 ▼
  ┌──────────────────────────────────────────┐
  │ processors[] — checked in order          │
  │                                          │
  │  ImageProcessor.canHandle('image/webp')  │──► true  ✓ use this one
  │  RawFileProcessor.canHandle(...)         │         (never reached)
  └──────────────────────────────────────────┘
                 │
                 │  4. processor.process(file, uploadPath, userId, storage, options)
                 ▼
           URL string returned
```

> `RawFileProcessor` is always last and always returns `true` from `canHandle`.
> It's the permanent fallback — any file with no dedicated processor passes through it unchanged.

---

## Path A — Simple Upload (e.g. avatar)

Used when: one file, one URL field on a model (`avatarPath`, `logoPath`).

```
UserService.updateAvatar(file, userId)
    │
    │  processFile(file, 'avatar', userId)
    ▼
FileProcessingService
    │  validates: ≤2MB, jpeg/png/webp only
    │  processor: ImageProcessor
    │    → resize 512×512, convert to jpeg, quality 80
    ▼
StorageBackend.saveFile()
    │
    ▼
returns '/files/avatars/42-1234567890.jpg'
    │
    ▼
prisma.user.update({ avatarPath: url })
```

**Caller picks the preset directly.** No indirection.

```ts
const url = await this.fileProcessing.processFile(file, 'avatar', userId);
await this.prisma.user.update({ where: { id: userId }, data: { avatarPath: url } });
```

---

## Path B — Complex Media Upload (e.g. article images)

Used when: multiple files, reordering, replace/remove per item, tracked in `Media` table.

```
ArticlesController.addMedia(files)
    │
    │  articlesService.addMediaBatch(articleId, files, userId, isPro)
    ▼
ArticlesService
    │  1. validate: images only (article-specific rule)
    │  2. pick preset: isPro ? 'mediaImagePro' : 'mediaImage'
    │  3. delegate to MediaService
    ▼
MediaService.addMediaBatch({ resourceWhere: { articleId }, files, userId, maxCount: 20, preset })
    │  checks: current count + new files ≤ maxCount
    │  for each file → addMedia({ resourceWhere: { articleId }, file, userId, preset })
    ▼
MediaService.addMedia()
    │  resolves preset: params.preset ?? detectPreset(file.mimetype)
    │  processFile(file, preset, userId)  ← same call as Path A
    ▼
FileProcessingService  (identical from here down)
    │
    ▼
StorageBackend.saveFile()
    │
    ▼
returns URL
    │
    ▼
prisma.media.create({ original: url, mimeType, sizeBytes, sortOrder, ...resourceWhere })
```

**MediaService picks the preset** (auto-detected from mimeType, or overridden by caller).
The resource service (ArticlesService) can override it — e.g. for pro tier.

---

## Preset Auto-Detection in MediaService

When no preset is passed explicitly, `MediaService.detectPreset` maps by MIME category:

```
file.mimetype
    │
    ├── starts with 'image/'  →  'mediaImage'
    ├── starts with 'video/'  →  'mediaVideo'
    └── anything else         →  'mediaDocument'
```

Override this by passing a `preset` explicitly:

```ts
// ArticlesService — pro user gets higher quality preset
const preset = isPro ? 'mediaImagePro' : 'mediaImage';
this.mediaService.addMediaBatch({ resourceWhere: { articleId }, files, userId, maxCount, preset });
```

---

## Processor Selection

Processors are checked in order. First one to return `true` from `canHandle` wins:

```
processors = [
  ImageProcessor,      canHandle → mimeType.startsWith('image/')
  RawFileProcessor,    canHandle → always true  (fallback)
]
```

To add a new dedicated processor (e.g. for video compression):
insert it **before** `RawFileProcessor` in the array.

```
processors = [
  ImageProcessor,
  VideoProcessor,      ← insert here, before fallback
  RawFileProcessor,
]
```

`RawFileProcessor` then only handles types that nothing else claimed.

---

## Adding Pro Tier — Summary of Touch Points

| File | Change |
|---|---|
| `file-upload-presets.ts` | Add `mediaImagePro` preset with higher quality/size |
| `ArticlesService.addMediaBatch` | Accept `isPro` flag, pass `preset` to MediaService |
| `ArticlesController.addMedia` | Look up subscription on `req.user`, pass `isPro` down |

Zero changes to `FileProcessingService`, `MediaService`, or any processor.

---

## Where Each Concern Lives

```
Who decides WHAT'S ALLOWED?        →  Preset (allowedMimeTypes, maxSize)
Who decides HOW IT'S PROCESSED?    →  Processor (resize, convert, raw)
Who decides WHICH PRESET TO USE?   →  The caller (Service layer)
Who decides resource-specific rules? →  Resource service (ArticlesService, PostsService)
Who stays generic / knows nothing?  →  MediaService, FileProcessingService
```
