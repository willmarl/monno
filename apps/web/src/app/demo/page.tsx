"use client";

import { useState } from "react";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useUpdateProfile } from "@/features/users/hooks";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AvatarUploadProps {
  onSuccess?: () => void;
}

export default function AvatarUpload({ onSuccess }: AvatarUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    updateProfile(
      { data: {}, file: selectedFile },
      {
        onSuccess: () => {
          setSelectedFile(null);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Profile Picture</h2>
        <p className="text-sm text-gray-500">
          Upload a new profile picture. Supported formats: JPEG, PNG, WebP, GIF
        </p>
      </div>

      <FileDropzone
        onFileSelect={handleFileSelect}
        disabled={isPending}
        preview
      />

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isPending}
        className="w-full"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Uploading..." : "Upload Picture"}
      </Button>
    </div>
  );
}
