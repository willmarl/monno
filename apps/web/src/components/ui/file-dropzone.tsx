"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
  preview?: boolean;
}

export function FileDropzone({
  onFileSelect,
  accept = { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  preview = true,
}: FileDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const reason = rejectedFiles[0].errors[0]?.code;
        if (reason === "file-too-large") {
          setError(
            `File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`
          );
        } else if (reason === "file-invalid-type") {
          setError("Invalid file type. Please upload an image.");
        } else {
          setError("File rejected");
        }
        return;
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);

        // Generate preview
        if (preview) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [onFileSelect, maxSize, preview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    disabled,
    multiple: false,
  });

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 bg-muted",
          disabled && "cursor-not-allowed opacity-50",
          "cursor-pointer p-8 text-center hover:bg-muted/80"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground/60" />
          <div>
            <p className="font-medium text-foreground">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to select files (Max {maxSize / 1024 / 1024}MB)
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview && previewUrl && (
        <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-border">
          <Image src={previewUrl} alt="Preview" fill className="object-cover" />
          <Button
            onClick={handleRemove}
            size="sm"
            variant="destructive"
            className="absolute right-1 top-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected file info */}
      {selectedFile && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <Button onClick={handleRemove} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
