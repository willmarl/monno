/**
 * Video Processor — reference implementation / guide
 *
 * This is a skeleton showing how to add a new file processor.
 * Replace the pseudo-code with real ffmpeg/fluent-ffmpeg calls when ready.
 *
 * Setup:
 *   1. pnpm add fluent-ffmpeg @types/fluent-ffmpeg
 *   2. Ensure ffmpeg is installed on the host / Docker image
 *   3. Register this processor in FileProcessingService:
 *        this.processors.push(new VideoProcessor());
 *   4. (Optional) Add video-specific fields to ProcessingOptions in
 *      file-upload-config.type.ts if you need more than the basics.
 */

import { FileProcessor } from '../file-processor.interface';
import { StorageBackend } from '../storage-backend.interface';
import { ProcessingOptions } from '../file-upload-config.type';
import { generateFilename } from '../generate-filename';
// import ffmpeg from 'fluent-ffmpeg';
// import { Readable } from 'stream';
// import { tmpdir } from 'os';
// import { join } from 'path';
// import { randomUUID } from 'crypto';
// import { unlink } from 'fs/promises';

const SUPPORTED_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

/** Extend ProcessingOptions for video-specific settings if needed */
// You could add these fields to ProcessingOptions in file-upload-config.type.ts:
//   maxDurationSec?: number;
//   videoBitrate?: string;    // e.g. '1000k'
//   audioBitrate?: string;    // e.g. '128k'
//   resolution?: string;      // e.g. '1280x720'

export class VideoProcessor implements FileProcessor {
  canHandle(mimeType: string): Promise<boolean> {
    return Promise.resolve(SUPPORTED_MIME_TYPES.includes(mimeType));
  }

  async process(
    file: any,
    fileType: string,
    userId: number,
    storageBackend: StorageBackend,
    options?: ProcessingOptions,
  ): Promise<string> {
    const filename = generateFilename(userId, 'mp4');

    // ──────────────────────────────────────────────
    // STEP 1: Write buffer to a temp file
    //   ffmpeg needs a file path, not a buffer
    // ──────────────────────────────────────────────
    // const tmpInput = join(tmpdir(), `input-${randomUUID()}.tmp`);
    // const tmpOutput = join(tmpdir(), `output-${randomUUID()}.mp4`);
    // await writeFile(tmpInput, file.buffer);

    // ──────────────────────────────────────────────
    // STEP 2: Probe the video (optional — for validation)
    //   Get duration, codec info, resolution, etc.
    // ──────────────────────────────────────────────
    // const metadata = await new Promise((resolve, reject) => {
    //   ffmpeg.ffprobe(tmpInput, (err, data) => {
    //     if (err) reject(err);
    //     else resolve(data);
    //   });
    // });
    //
    // const duration = metadata.format.duration; // seconds
    // const maxDuration = options?.maxDurationSec ?? 60;
    // if (duration > maxDuration) {
    //   await unlink(tmpInput);
    //   throw new Error(`Video exceeds max duration of ${maxDuration}s`);
    // }

    // ──────────────────────────────────────────────
    // STEP 3: Transcode / compress / trim
    // ──────────────────────────────────────────────
    // await new Promise<void>((resolve, reject) => {
    //   let command = ffmpeg(tmpInput)
    //     .output(tmpOutput)
    //     .videoCodec('libx264')       // H.264
    //     .audioCodec('aac')           // AAC audio
    //     .videoBitrate(options?.videoBitrate ?? '1000k')
    //     .audioBitrate(options?.audioBitrate ?? '128k')
    //     .outputOptions([
    //       '-movflags', 'faststart',  // web-optimized MP4
    //       '-preset', 'fast',         // encoding speed vs compression
    //     ]);
    //
    //   // Optional: resize
    //   const resolution = options?.resolution; // e.g. '1280x720'
    //   if (resolution) {
    //     command = command.size(resolution);
    //   }
    //
    //   // Optional: trim to max duration
    //   // command = command.duration(maxDuration);
    //
    //   command
    //     .on('end', () => resolve())
    //     .on('error', (err) => reject(err))
    //     .run();
    // });

    // ──────────────────────────────────────────────
    // STEP 4: Read output and save via storage backend
    // ──────────────────────────────────────────────
    // const outputBuffer = await readFile(tmpOutput);
    // const savedPath = await storageBackend.saveFile(outputBuffer, fileType, filename);

    // ──────────────────────────────────────────────
    // STEP 5: Cleanup temp files
    // ──────────────────────────────────────────────
    // await Promise.all([
    //   unlink(tmpInput).catch(() => {}),
    //   unlink(tmpOutput).catch(() => {}),
    // ]);

    // return savedPath;

    // Placeholder until real implementation
    throw new Error(
      'VideoProcessor is not yet implemented. Uncomment the code above and install fluent-ffmpeg.',
    );
  }
}
