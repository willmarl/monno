"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserAdminSchema,
  UpdateUserAdminInput,
} from "../schemas/updateUserAdmin.schema";
import { useUpdateUserAdmin } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { User } from "@/features/users/types/user";

interface InlineUpdateUserAdminFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
  isAlwaysOpen?: boolean;
}

export function InlineUpdateUserAdminForm({
  user,
  onSuccess,
  onCancel,
  isAlwaysOpen = false,
}: InlineUpdateUserAdminFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<UpdateUserAdminInput>({
    resolver: zodResolver(updateUserAdminSchema),
    mode: "onChange",
    defaultValues: {
      username: user.username,
      email: user.email || "",
      avatarPath: user.avatarPath || "",
      password: "",
    },
  });

  const updateUserAdminMutation = useUpdateUserAdmin();

  const { isValid } = form.formState;

  const handleSubmit = (data: UpdateUserAdminInput) => {
    // Filter out empty strings
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== ""),
    ) as UpdateUserAdminInput;

    updateUserAdminMutation.mutate(
      { id: user.id, data: filteredData },
      {
        onSuccess: () => {
          form.reset();
          if (!isAlwaysOpen) {
            setIsOpen(false);
          }
          onSuccess?.();
        },
      },
    );
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Change UpdateUserAdmin
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* Input fields here*/}
      {/* username */}
      <div className="space-y-2">
        <Label htmlFor="inline-username" className="text-sm">
          Username
        </Label>
        <Input
          id="inline-username"
          type="text"
          disabled={updateUserAdminMutation.isPending}
          {...form.register("username")}
        />
        {form.formState.errors.username && (
          <p className="text-xs text-red-500">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      {/* avatarPath */}
      <div className="space-y-2">
        <Label htmlFor="inline-avatarPath" className="text-sm">
          Avatar Path
        </Label>
        <Input
          id="inline-avatarPath"
          type="text"
          disabled={updateUserAdminMutation.isPending}
          {...form.register("avatarPath")}
        />
        {form.formState.errors.avatarPath && (
          <p className="text-xs text-red-500">
            {form.formState.errors.avatarPath.message}
          </p>
        )}
      </div>

      {/* email */}
      <div className="space-y-2">
        <Label htmlFor="inline-email" className="text-sm">
          Email
        </Label>
        <Input
          id="inline-email"
          type="text"
          disabled={updateUserAdminMutation.isPending}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-red-500">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* password */}
      <div className="space-y-2">
        <Label htmlFor="inline-password" className="text-sm">
          Password
        </Label>
        <Input
          id="inline-password"
          type="text"
          disabled={updateUserAdminMutation.isPending}
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-red-500">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={updateUserAdminMutation.isPending}
        >
          {isAlwaysOpen ? "Clear" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={updateUserAdminMutation.isPending || !isValid}
        >
          {updateUserAdminMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {updateUserAdminMutation.isPending ? "Updating..." : "Update User"}
        </Button>
      </div>
    </form>
  );
}
