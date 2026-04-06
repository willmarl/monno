"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editUserAdminSchema,
  EditUserAdminInput,
} from "../schemas/editUserAdmin.schema";
import { useAdminUpdateUser } from "../../../users/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { User } from "@/features/users/types/user";
import { AvatarUpload } from "@/components/ui/avatar-upload";

interface InlineEditUserAdminFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

export function InlineEditUserAdminForm({
  user,
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: InlineEditUserAdminFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<EditUserAdminInput>({
    resolver: zodResolver(editUserAdminSchema),
    mode: "onChange",
    defaultValues: {
      username: user.username,
      email: user.email || "",
      avatarPath: user.avatarPath || "",
      password: "",
      role: user.role,
      status: user.status,
      statusReason: user.statusReason || "",
    },
  });

  const editUserAdminMutation = useAdminUpdateUser();

  const { isValid } = form.formState;

  const handleSubmit = (data: EditUserAdminInput) => {
    // Filter out empty strings
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== ""),
    ) as EditUserAdminInput;

    editUserAdminMutation.mutate(
      { id: user.id, data: filteredData, file: selectedFile || undefined },
      {
        onSuccess: () => {
          form.reset();
          setSelectedFile(null);
          if (!isAlwaysOpen) {
            setIsOpen(false);
          }
          onSuccess?.();
        },
        onError: (err) => {
          onError?.(err);
        },
      },
    );
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Edit User
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* username */}
      <div className="space-y-2">
        <Label htmlFor="inline-username" className="text-sm">
          Username
        </Label>
        <Input
          id="inline-username"
          type="text"
          disabled={editUserAdminMutation.isPending}
          {...form.register("username")}
        />
        {form.formState.errors.username && (
          <p className="text-xs text-red-500">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      {/* avatar */}
      <div className="space-y-2">
        <Label className="text-sm">Avatar</Label>
        <AvatarUpload
          onFileSelect={setSelectedFile}
          disabled={editUserAdminMutation.isPending}
          currentAvatarUrl={user?.avatarPath || undefined}
          maxSize={2 * 1024 * 1024}
        />
      </div>

      {/* email */}
      <div className="space-y-2">
        <Label htmlFor="inline-email" className="text-sm">
          Email
        </Label>
        <Input
          id="inline-email"
          type="text"
          disabled={editUserAdminMutation.isPending}
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
          disabled={editUserAdminMutation.isPending}
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-red-500">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {/* role */}
      <div className="space-y-2">
        <Label htmlFor="inline-role" className="text-sm">
          Role
        </Label>
        <Controller
          name="role"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="inline-role"
                disabled={editUserAdminMutation.isPending}
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MOD">Moderator</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.role && (
          <p className="text-xs text-red-500">
            {form.formState.errors.role.message}
          </p>
        )}
      </div>

      {/* status */}
      <div className="space-y-2">
        <Label htmlFor="inline-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="inline-status"
                disabled={editUserAdminMutation.isPending}
              >
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="BANNED">Banned</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* statusReason */}
      <div className="space-y-2">
        <Label htmlFor="inline-statusReason" className="text-sm">
          Status Reason
        </Label>
        <Textarea
          id="inline-statusReason"
          placeholder="Reason for status change (optional)"
          disabled={editUserAdminMutation.isPending}
          {...form.register("statusReason")}
        />
        {form.formState.errors.statusReason && (
          <p className="text-xs text-red-500">
            {form.formState.errors.statusReason.message}
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
            setSelectedFile(null);
            onCancel?.();
          }}
          disabled={editUserAdminMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={editUserAdminMutation.isPending || !isValid}
        >
          {editUserAdminMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {editUserAdminMutation.isPending ? "Saving..." : "Save User"}
        </Button>
      </div>
    </form>
  );
}
