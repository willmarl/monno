"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updatePasswordSchema,
  UpdatePasswordInput,
} from "../schemas/updatePassword.schema";
import { useChangePassword } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface InlinePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

// Form type includes confirmPassword for validation
type FormInputs = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function InlinePasswordForm({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: InlinePasswordFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormInputs>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onChange",
  });

  const updatePasswordMutation = useChangePassword();

  const { isValid } = form.formState;

  const handleSubmit = (data: FormInputs) => {
    // Only send currentPassword and newPassword to backend, omit confirmPassword
    const submitData: UpdatePasswordInput = {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    };
    updatePasswordMutation.mutate(submitData, {
      onSuccess: () => {
        form.reset();
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
      onError: (err) => {
        onError?.(err);
      },
    });
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Change Password
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* Current Password Field */}
      <div className="space-y-2">
        <Label htmlFor="inline-current-password" className="text-sm">
          Current Password
        </Label>
        <Input
          id="inline-current-password"
          type="password"
          placeholder="Enter current password"
          disabled={updatePasswordMutation.isPending}
          {...form.register("currentPassword")}
        />
        {form.formState.errors.currentPassword && (
          <p className="text-xs text-red-500">
            {form.formState.errors.currentPassword.message}
          </p>
        )}
      </div>

      {/* New Password Field */}
      <div className="space-y-2">
        <Label htmlFor="inline-new-password" className="text-sm">
          New Password
        </Label>
        <Input
          id="inline-new-password"
          type="password"
          placeholder="Enter new password"
          disabled={updatePasswordMutation.isPending}
          {...form.register("newPassword")}
        />
        {form.formState.errors.newPassword && (
          <p className="text-xs text-red-500">
            {form.formState.errors.newPassword.message}
          </p>
        )}
      </div>

      {/* Confirm New Password Field */}
      <div className="space-y-2">
        <Label htmlFor="inline-confirm-password" className="text-sm">
          Confirm New Password
        </Label>
        <Input
          id="inline-confirm-password"
          type="password"
          placeholder="Confirm new password"
          disabled={updatePasswordMutation.isPending}
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-xs text-red-500">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={updatePasswordMutation.isPending}
        >
          {isAlwaysOpen ? "Clear" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={updatePasswordMutation.isPending || !isValid}
        >
          {updatePasswordMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </form>
  );
}
