"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

export function ConfirmModal({
  message,
  onConfirm,
  variant = "outline",
  onSuccess,
  onError,
}: {
  message: string;
  onConfirm: () => void;
  variant?: ButtonVariant;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  return (
    <div className="flex flex-col space-y-4">
      <p>{message}</p>

      <div className="flex justify-end gap-3">
        <Button variant={variant} onClick={onConfirm}>
          Yes
        </Button>
      </div>
    </div>
  );
}
