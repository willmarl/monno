/**
 * Detect MIME type from file magic bytes (not client-supplied mimetype).
 * Covers the MIME types used in FILE_PRESETS.
 */

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLS_MIME = 'application/vnd.ms-excel';

function startsWith(buf: Buffer, bytes: number[]): boolean {
  if (buf.length < bytes.length) return false;
  return bytes.every((b, i) => buf[i] === b);
}

function looksLikeText(buf: Buffer): boolean {
  const sample = buf.subarray(0, Math.min(buf.length, 8192));
  if (sample.includes(0)) return false;
  // Reject obvious binary high-bit density without being utf-8 BOM text
  let weird = 0;
  for (const b of sample) {
    if (b === 9 || b === 10 || b === 13) continue;
    if (b < 32 || b === 127) weird++;
  }
  return weird / Math.max(sample.length, 1) < 0.05;
}

/** Sniff buffer → canonical MIME or null if unknown. */
export function sniffMimeFromBuffer(buf: Buffer): string | null {
  if (!buf?.length) return null;

  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  if (
    startsWith(buf, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWith(buf, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return 'image/gif';
  }
  // RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return 'application/pdf';

  // MP4 / ISO BMFF: ....ftyp at offset 4
  if (
    buf.length >= 8 &&
    buf.toString('ascii', 4, 8) === 'ftyp'
  ) {
    return 'video/mp4';
  }

  // WebM / Matroska EBML
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return 'video/webm';

  // OLE compound (legacy XLS)
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return XLS_MIME;
  }

  // ZIP family (XLSX / generic zip)
  if (
    startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(buf, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(buf, [0x50, 0x4b, 0x07, 0x08])
  ) {
    const head = buf.subarray(0, Math.min(buf.length, 8192)).toString('binary');
    if (
      head.includes('[Content_Types].xml') ||
      head.includes('xl/') ||
      head.includes('xl\\')
    ) {
      return XLSX_MIME;
    }
    return 'application/zip';
  }

  if (looksLikeText(buf)) return 'text/csv';

  return null;
}

/**
 * Resolve the MIME to use for allowlist + processing.
 * Prefers magic bytes; maps zip→xlsx / text→csv when those are allowed.
 */
export function resolveUploadMime(
  buffer: Buffer,
  allowedMimeTypes: readonly string[],
): string {
  let detected = sniffMimeFromBuffer(buffer);

  if (detected === 'application/zip') {
    if (allowedMimeTypes.includes(XLSX_MIME)) {
      detected = XLSX_MIME;
    } else if (!allowedMimeTypes.includes('application/zip')) {
      detected = null;
    }
  }

  if (detected === 'text/csv' && !allowedMimeTypes.includes('text/csv')) {
    detected = null;
  }

  // Legacy xls vs xlsx: OLE sniff already returns XLS_MIME
  if (detected === XLS_MIME && !allowedMimeTypes.includes(XLS_MIME)) {
    detected = null;
  }

  if (!detected || !allowedMimeTypes.includes(detected)) {
    const allowed = allowedMimeTypes.join(', ');
    throw Object.assign(
      new Error(
        detected
          ? `File content type ${detected} is not allowed. Allowed: ${allowed}`
          : `Could not verify file type from content. Allowed: ${allowed}`,
      ),
      { name: 'UploadMimeError' },
    );
  }

  return detected;
}

/** Prefer extension derived from server MIME over client originalname. */
export function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'application/pdf':
      return 'pdf';
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'text/csv':
      return 'csv';
    case XLSX_MIME:
      return 'xlsx';
    case XLS_MIME:
      return 'xls';
    default:
      return 'bin';
  }
}
