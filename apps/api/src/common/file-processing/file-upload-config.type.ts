/**
 * Processing options passed through to file processors.
 * Each processor uses the subset relevant to it.
 */
export interface ProcessingOptions {
  /** Image resize dimensions */
  resize?: {
    width: number;
    height: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  /** Output format for images */
  format?: 'jpeg' | 'png' | 'webp';
  /** Output quality (1-100) */
  quality?: number;
}

/**
 * Configuration for a file upload — either passed directly
 * or resolved from a preset.
 */
export interface FileUploadConfig {
  /** Max file size in bytes */
  maxSize: number;
  /** Allowed MIME types */
  allowedMimeTypes: string[];
  /** Upload subdirectory path (e.g. 'avatars', 'posts/images') */
  uploadPath: string;
  /** Optional processing options forwarded to the file processor */
  processingOptions?: ProcessingOptions;
}
