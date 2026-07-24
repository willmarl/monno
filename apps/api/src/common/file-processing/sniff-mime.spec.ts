import { describe, expect, it } from 'vitest';
import {
  extensionForMime,
  resolveUploadMime,
  sniffMimeFromBuffer,
} from './sniff-mime';

describe('sniffMimeFromBuffer', () => {
  it('detects jpeg / png / gif / pdf', () => {
    expect(sniffMimeFromBuffer(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      'image/jpeg',
    );
    expect(
      sniffMimeFromBuffer(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe('image/png');
    expect(sniffMimeFromBuffer(Buffer.from('GIF89a......'))).toBe('image/gif');
    expect(sniffMimeFromBuffer(Buffer.from('%PDF-1.4'))).toBe('application/pdf');
  });

  it('detects webp and mp4', () => {
    const webp = Buffer.alloc(12);
    webp.write('RIFF', 0);
    webp.write('WEBP', 8);
    expect(sniffMimeFromBuffer(webp)).toBe('image/webp');

    const mp4 = Buffer.alloc(12);
    mp4.write('ftyp', 4);
    expect(sniffMimeFromBuffer(mp4)).toBe('video/mp4');
  });

  it('maps zip with xl markers to xlsx', () => {
    const zip = Buffer.from('PK\x03\x04....[Content_Types].xml....xl/workbook');
    expect(sniffMimeFromBuffer(zip)).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });
});

describe('resolveUploadMime', () => {
  const imageAllowed = ['image/jpeg', 'image/png', 'image/webp'] as const;

  it('accepts sniffed type when allowlisted', () => {
    expect(
      resolveUploadMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), imageAllowed),
    ).toBe('image/jpeg');
  });

  it('rejects mismatched content (exe claimed as image)', () => {
    const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ
    expect(() => resolveUploadMime(exe, imageAllowed)).toThrow(/verify|not allowed/i);
  });

  it('maps generic zip to xlsx when that mime is allowed', () => {
    const zip = Buffer.from('PK\x03\x04............');
    expect(
      resolveUploadMime(zip, [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]),
    ).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });
});

describe('extensionForMime', () => {
  it('returns stable extensions', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('application/pdf')).toBe('pdf');
  });
});
