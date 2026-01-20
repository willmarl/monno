"use client";

import { Button } from "@/components/ui/button";

export function ConfirmModal({
  message,
  onConfirm,
}: {
  message: string;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col space-y-4">
      <p>{message}</p>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onConfirm}>
          Yes
        </Button>
      </div>
    </div>
  );
}
