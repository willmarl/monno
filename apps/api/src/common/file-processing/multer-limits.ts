import { FILE_PRESETS } from './file-upload-presets';

/**
 * Multer `limits` options aligned with FILE_PRESETS.
 * Parser-layer caps reject oversized uploads before buffering into processFile.
 */

export const avatarMulterOptions = {
  limits: { fileSize: FILE_PRESETS.avatar.maxSize },
} as const;

/** Largest media preset (video 50 MB) — article/admin media accepts mixed types. */
export const mediaMulterOptions = {
  limits: {
    fileSize: Math.max(
      FILE_PRESETS.mediaImage.maxSize,
      FILE_PRESETS.mediaVideo.maxSize,
      FILE_PRESETS.mediaDocument.maxSize,
    ),
  },
} as const;
