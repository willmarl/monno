# Guide: Adding a New File Upload Type (for example Excel → CSV)

Here's the complete step-by-step process using modular architecture:

## Step 1: Add a Preset to `file-upload-presets.ts`

```typescript
// ...existing code...

export const FILE_PRESETS = {
  // ...existing presets...

  excel: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ],
    uploadPath: "uploads/spreadsheets",
    processingOptions: {
      // Excel-specific options
      outputFormat: "csv", // Convert to CSV
      delimiter: ",", // Use comma as delimiter
      includeHeaders: true, // Include column headers
      sheetIndex: 0, // Process first sheet
    },
  },
} as const satisfies Record<string, FileUploadConfig>;

export type FilePresetName = keyof typeof FILE_PRESETS;
```

## Step 2: Update `ProcessingOptions` Type to Support Excel Options

```typescript
// filepath: apps/api/src/common/file-processing/file-upload-config.type.ts
// ...existing code...

export interface ProcessingOptions {
  // Image-specific
  resize?: {
    width: number;
    height: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  };
  format?: "jpeg" | "png" | "webp";
  quality?: number;

  // Spreadsheet-specific
  outputFormat?: "csv" | "json" | "tsv";
  delimiter?: "," | ";" | "\t" | "|";
  includeHeaders?: boolean;
  sheetIndex?: number;

  // Video-specific (from before)
  // maxDurationSec?: number;
  // videoBitrate?: string;
  // audioBitrate?: string;
  // resolution?: { width: number; height: number };
}
```

## Step 3: Create the Excel Processor

Note this can be skipped or at least heavily simplified if you dont want any modification done to uploaded file and just want raw upload.

```typescript
// filepath: apps/api/src/common/file-processing/processors/excel.processor.ts
import { FileProcessor } from "../file-processor.interface";
import { StorageBackend } from "../storage-backend.interface";
import { ProcessingOptions } from "../file-upload-config.type";
import * as XLSX from "xlsx";
import { parse } from "json2csv";

/** Supported Excel MIME types */
const SUPPORTED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
];

export class ExcelProcessor implements FileProcessor {
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
    try {
      // Parse options with defaults
      const outputFormat = options?.outputFormat ?? "csv";
      const delimiter = options?.delimiter ?? ",";
      const includeHeaders = options?.includeHeaders ?? true;
      const sheetIndex = options?.sheetIndex ?? 0;

      // Step 1: Read Excel file from buffer
      const workbook = XLSX.read(file.buffer, { type: "buffer" });

      // Get sheet names and validate sheet exists
      const sheetNames = workbook.SheetNames;
      if (sheetIndex >= sheetNames.length) {
        throw new Error(
          `Sheet index ${sheetIndex} does not exist. Available sheets: ${sheetNames.join(", ")}`,
        );
      }

      // Step 2: Extract sheet data
      const sheetName = sheetNames[sheetIndex];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error(`Sheet "${sheetName}" is empty`);
      }

      // Step 3: Convert to target format
      let outputContent: string;
      const ext = outputFormat === "json" ? "json" : outputFormat;
      const filename = `${userId}-${Date.now()}.${ext}`;

      if (outputFormat === "csv" || outputFormat === "tsv") {
        outputContent = this.convertToDelimitedFormat(
          jsonData,
          delimiter,
          includeHeaders,
        );
      } else if (outputFormat === "json") {
        outputContent = JSON.stringify(jsonData, null, 2);
      } else {
        throw new Error(`Unsupported output format: ${outputFormat}`);
      }

      // Step 4: Save via storage backend
      const buffer = Buffer.from(outputContent, "utf-8");
      return await storageBackend.saveFile(buffer, fileType, filename);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Excel processing failed: ${message}`);
    }
  }

  /**
   * Convert JSON array to delimited format (CSV/TSV)
   * Handles quotes, escaping, etc.
   */
  private convertToDelimitedFormat(
    data: any[],
    delimiter: string,
    includeHeaders: boolean,
  ): string {
    if (data.length === 0) return "";

    const keys = Object.keys(data[0]);
    const rows: string[] = [];

    // Add headers if requested
    if (includeHeaders) {
      rows.push(this.escapeLine(keys, delimiter));
    }

    // Add data rows
    for (const row of data) {
      const values = keys.map((key) => row[key] ?? "");
      rows.push(this.escapeLine(values, delimiter));
    }

    return rows.join("\n");
  }

  /**
   * Escape values and join with delimiter
   * Handles: commas, quotes, newlines in values
   */
  private escapeLine(values: any[], delimiter: string): string {
    return values
      .map((val) => {
        const str = String(val ?? "");
        // Quote if contains delimiter, quote, or newline
        if (
          str.includes(delimiter) ||
          str.includes('"') ||
          str.includes("\n")
        ) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(delimiter);
  }
}
```

## Step 4: Register the Processor in `FileProcessingService`

```typescript
// filepath: apps/api/src/common/file-processing/file-processing.service.ts
import { ImageProcessor } from "./processors/image.processor";
import { ExcelProcessor } from "./processors/excel.processor";

@Injectable()
export class FileProcessingService {
  private processors: FileProcessor[] = [
    new ImageProcessor(),
    new ExcelProcessor(), // <- ADD THIS
  ];

  // ...rest of code...
}
```

## Step 5: Use It in Your Application

Now you can use it anywhere like this:

```typescript
// Basic usage — use preset defaults
const csvPath = await this.fileProcessing.processFile(
  excelFile,
  "excel",
  userId,
);

// With overrides — e.g., use semicolon delimiter and include sheet 1
const csvPath = await this.fileProcessing.processFile(
  excelFile,
  "excel",
  userId,
  {
    processingOptions: {
      delimiter: ";",
      sheetIndex: 1,
    },
  },
);

// Fully custom — no preset
const csvPath = await this.fileProcessing.processFile(
  excelFile,
  {
    maxSize: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    uploadPath: "reports/converted",
    processingOptions: {
      outputFormat: "json",
      sheetIndex: 0,
    },
  },
  userId,
);
```

if you are actually implementing this example of excel to CSV then install these deps. This file is more so suppose to be reference/guide, you will most definitely need to look up good libs/deps to use for processing/accepting rare file upload types

```bash
pnpm add xlsx json2csv
pnpm add -D @types/json2csv
```

---

## Summary: The Pattern

| Step             | What You Do                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| **1. Preset**    | Add config with `maxSize`, MIME types, `uploadPath`, processor-specific options |
| **2. Type**      | Update `ProcessingOptions` with your processor's config fields                  |
| **3. Processor** | Create class implementing `FileProcessor` with `canHandle()` + `process()`      |
| **4. Register**  | Add instance to `processors[]` in `FileProcessingService` constructor           |
| **5. Use**       | Call `processFile(file, 'presetName', userId)` from anywhere                    |

**The best part:** Once it's set up, adding a new file type (e.g., PDF → images, videos → thumbnails) follows the exact same pattern. No changes to the core service, no breaking changes to existing code.---
