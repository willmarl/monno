"use client";

import { useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, ZoomIn, ZoomOut, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  currentAvatarUrl?: string;
  maxSize?: number;
}

export function AvatarUpload({
  onFileSelect,
  disabled = false,
  currentAvatarUrl,
  maxSize = 5 * 1024 * 1024,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditor>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(0);
      setError(`File is too large. Maximum size is ${maxMB}MB`);
      return;
    }

    // Read file as data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editorRef.current || !selectedImage) return;

    try {
      const canvas = editorRef.current.getImage();
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "avatar.png", { type: "image/png" });
          onFileSelect(file);
          // Show preview of cropped image
          setPreviewUrl(canvas.toDataURL("image/png"));
          // Reset state
          setSelectedImage(null);
          setZoom(1);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      }, "image/png");
    } catch (err) {
      setError("Failed to process image");
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setZoom(1);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setSelectedImage(null);
    setZoom(1);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Show editor
  if (selectedImage) {
    return (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <AvatarEditor
                ref={editorRef}
                image={selectedImage}
                width={250}
                height={250}
                border={0}
                borderRadius={125}
                color={[0, 0, 0, 0.6]}
                scale={zoom}
                rotate={0}
              />
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="space-y-3">
            <Label htmlFor="zoom-slider" className="text-sm">
              Zoom: {Math.round(zoom * 100)}%
            </Label>
            <input
              id="zoom-slider"
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
              disabled={disabled}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                disabled={disabled || zoom <= 1}
                className="cursor-pointer"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                disabled={disabled || zoom >= 3}
                className="cursor-pointer"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={disabled}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={disabled}
              className="cursor-pointer"
            >
              Save Avatar
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Show upload area
  return (
    <div className="space-y-4">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Upload Button / Preview Area */}
      <div className="space-y-2">
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "relative rounded-full h-32 w-32 border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors",
            disabled
              ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-primary",
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="New avatar preview"
              className="h-full w-full rounded-full object-cover"
            />
          ) : currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Current avatar"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500 text-center px-2">
                Click to upload
              </span>
            </div>
          )}
        </div>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={disabled}
            className="gap-2 cursor-pointer"
          >
            <X className="h-4 w-4" />
            Change
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        JPG, PNG, WebP or GIF (max. {(maxSize / 1024 / 1024).toFixed(0)}MB)
      </p>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
