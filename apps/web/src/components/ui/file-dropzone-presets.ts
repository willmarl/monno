export interface DropzoneConfig {
  accept: Record<string, string[]>;
  maxSize: number;
  /** Human-readable label shown in the dropzone hint */
  hint: string;
}

export const DROPZONE_PRESETS = {
  avatar: {
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxSize: 2 * 1024 * 1024, // 2 MB
    hint: "JPEG, PNG or WebP up to 2 MB",
  },

  articleImage: {
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxSize: 5 * 1024 * 1024, // 5 MB
    hint: "JPEG, PNG, WebP or GIF up to 5 MB",
  },

  postImage: {
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxSize: 5 * 1024 * 1024, // 5 MB
    hint: "JPEG, PNG, WebP or GIF up to 5 MB",
  },

  video: {
    accept: { "video/*": [".mp4", ".webm"] },
    maxSize: 50 * 1024 * 1024, // 50 MB
    hint: "MP4 or WebM up to 50 MB",
  },

  document: {
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024, // 10 MB
    hint: "PDF up to 10 MB",
  },
} as const satisfies Record<string, DropzoneConfig>;

export type DropzonePresetName = keyof typeof DROPZONE_PRESETS;
