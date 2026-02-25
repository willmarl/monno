"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TextPreviewCellProps {
  value: string;
  title: string;
  maxLength?: number;
}

export function TextPreviewCell({
  value,
  title,
  maxLength = 30,
}: TextPreviewCellProps) {
  const [open, setOpen] = useState(false);
  const truncated =
    value.length > maxLength ? value.slice(0, maxLength - 3) + "..." : value;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="max-w-40 truncate text-sm cursor-pointer hover:opacity-75 transition-opacity"
        title={value || undefined}
      >
        {truncated || "—"}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm whitespace-pre-wrap break-words">{value}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
