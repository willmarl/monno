import { FileUploadConfig } from './file-upload-config.type';

/**
 * Pre-configured file upload presets.
 * Use a preset name with processFile() for convenience,
 * and optionally pass overrides to tweak individual settings.
 *
 * @example
 *   processFile(file, 'avatar', userId)
 *   processFile(file, 'avatar', userId, { maxSize: 5 * 1024 * 1024 })
 */
export const FILE_PRESETS = {
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadPath: 'avatars',
    processingOptions: {
      resize: { width: 512, height: 512, fit: 'cover' as const },
      format: 'jpeg' as const,
      quality: 80,
    },
  },

  //   The presets below are rough examples. they have no processor so upload will store it raw.
  //   These are more so to act as guide/reference. Should remove or update to make them more sophisticated
  postImage: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    uploadPath: 'posts/images',
    processingOptions: {
      resize: { width: 1920, height: 1080, fit: 'inside' as const },
      format: 'webp' as const,
      quality: 85,
    },
  },

  video: {
    maxSize: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: ['video/mp4', 'video/webm'],
    uploadPath: 'videos',
  },

  document: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['application/pdf'],
    uploadPath: 'documents',
  },
} as const satisfies Record<string, FileUploadConfig>;

/** Union of all available preset names */
export type FilePresetName = keyof typeof FILE_PRESETS;
