"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

export function ConfirmModal({
  message,
  onConfirm,
  variant = "outline",
  buttonMessage = "Yes",
  showButton = true,
  showCancelButton = false,
  cancelButtonMessage = "No",
  onCancel,
  onSuccess,
  onError,
}: {
  message: string;
  onConfirm: () => void;
  variant?: ButtonVariant;
  buttonMessage?: string;
  showButton?: boolean;
  showCancelButton?: boolean;
  cancelButtonMessage?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  return (
    <div className="flex flex-col space-y-4">
      <p>{message}</p>

      <div className="flex justify-end gap-3">
        {showCancelButton && (
          <Button variant="outline" onClick={onCancel}>
            {cancelButtonMessage}
          </Button>
        )}
        {showButton ? (
          <Button variant={variant} onClick={onConfirm}>
            {buttonMessage}
          </Button>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
