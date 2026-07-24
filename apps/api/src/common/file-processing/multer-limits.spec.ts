import { describe, expect, it } from 'vitest';
import { FILE_PRESETS } from './file-upload-presets';
import { avatarMulterOptions, mediaMulterOptions } from './multer-limits';

describe('multer-limits', () => {
  it('avatar limit matches avatar preset', () => {
    expect(avatarMulterOptions.limits.fileSize).toBe(
      FILE_PRESETS.avatar.maxSize,
    );
  });

  it('media limit is at least the largest media preset', () => {
    expect(mediaMulterOptions.limits.fileSize).toBeGreaterThanOrEqual(
      FILE_PRESETS.mediaVideo.maxSize,
    );
  });
});
