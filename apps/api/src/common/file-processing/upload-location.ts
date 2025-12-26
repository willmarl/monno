/**
 * Utility to generate backend-specific upload location paths
 * Handles both local and S3 storage with validation
 */

export class UploadLocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadLocationError';
  }
}

/**
 * Generate the upload location path with validation
 * Works for both local and S3 backends (S3 backend handles its own prefixing)
 *
 * @param location - Base location (e.g., '/avatars', 'posts/images')
 * @returns Normalized location path ('avatars' or 'posts/images')
 * @throws UploadLocationError if location is invalid
 *
 * @example
 * uploadLocation('/avatars') // returns 'avatars'
 * uploadLocation('posts/images') // returns 'posts/images'
 */
export function uploadLocation(location: string): string {
  // Validate location
  validateUploadLocation(location);

  const normalizedLocation = normalizeLocation(location);

  return normalizedLocation.startsWith('/')
    ? normalizedLocation.slice(1)
    : normalizedLocation;
}

/**
 * Validate upload location for illegal characters and patterns
 * Allows: alphanumeric, forward slashes, underscores, hyphens
 * Disallows: spaces, backslashes, dots (except extension), special chars
 */
function validateUploadLocation(location: string): void {
  if (!location || typeof location !== 'string') {
    throw new UploadLocationError('Location must be a non-empty string');
  }

  // Check for spaces
  if (location.includes(' ')) {
    throw new UploadLocationError('Location cannot contain spaces');
  }

  // Check for backslashes (Windows path separator)
  if (location.includes('\\')) {
    throw new UploadLocationError('Location cannot contain backslashes');
  }

  // Check for path traversal attempts
  if (location.includes('..')) {
    throw new UploadLocationError(
      'Location cannot contain path traversal sequences',
    );
  }

  // Check for double slashes
  if (location.includes('//')) {
    throw new UploadLocationError('Location cannot contain double slashes');
  }

  // Check for illegal characters (allow only alphanumeric, /, _, -, .)
  if (!/^[a-zA-Z0-9/_.-]+$/.test(location)) {
    throw new UploadLocationError(
      'Location can only contain alphanumeric characters, forward slashes, underscores, hyphens, and dots',
    );
  }

  // Don't allow leading/trailing slashes in subdirectories
  if (location.endsWith('/')) {
    throw new UploadLocationError('Location cannot end with a slash');
  }
}

/**
 * Normalize location string (ensure leading slash)
 */
function normalizeLocation(location: string): string {
  const trimmed = location.trim();
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
