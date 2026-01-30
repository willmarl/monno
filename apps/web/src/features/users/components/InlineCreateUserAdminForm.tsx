"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserAdminSchema,
  CreateUserAdminInput,
} from "../schemas/createUserAdmin.schema";
import { useAdminCreateUser } from "../hooks";
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
import { Loader2 } from "lucide-react";

interface InlineCreateUserAdminFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isAlwaysOpen?: boolean;
}

export function InlineCreateUserAdminForm({
  onSuccess,
  onCancel,
  isAlwaysOpen = false,
}: InlineCreateUserAdminFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreateUserAdminInput>({
    resolver: zodResolver(createUserAdminSchema),
    mode: "onChange",
  });

  const createUserAdminMutation = useAdminCreateUser();

  const { isValid } = form.formState;

  const handleSubmit = (data: CreateUserAdminInput) => {
    // Filter out empty strings
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== ""),
    ) as CreateUserAdminInput;

    createUserAdminMutation.mutate(filteredData, {
      onSuccess: () => {
        form.reset();
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
    });
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Change CreateUserAdmin
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
          disabled={createUserAdminMutation.isPending}
          {...form.register("username")}
        />
        {form.formState.errors.username && (
          <p className="text-xs text-red-500">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      {/* password */}
      <div className="space-y-2">
        <Label htmlFor="inline-password" className="text-sm">
          password
        </Label>
        <Input
          id="inline-password"
          type="text"
          disabled={createUserAdminMutation.isPending}
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-red-500">
            {form.formState.errors.password.message}
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
          disabled={createUserAdminMutation.isPending}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-red-500">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* avatarPath */}
      {/* <div className="space-y-2">
        <Label htmlFor="inline-avatarPath" className="text-sm">
          Avatar Path
        </Label>
        <Input
          id="inline-avatarPath"
          type="text"
          disabled={createUserAdminMutation.isPending}
          {...form.register("avatarPath")}
        />
        {form.formState.errors.avatarPath && (
          <p className="text-xs text-red-500">
            {form.formState.errors.avatarPath.message}
          </p>
        )}
      </div> */}

      {/* role */}
      <div className="space-y-2">
        <Label htmlFor="inline-role" className="text-sm">
          Role
        </Label>
        <Select
          onValueChange={(value) => form.setValue("role", value as any)}
          defaultValue={form.getValues("role") || ""}
          disabled={createUserAdminMutation.isPending}
        >
          <SelectTrigger id="inline-role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MOD">Mod</SelectItem>
          </SelectContent>
        </Select>
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
        <Select
          onValueChange={(value) => form.setValue("status", value as any)}
          defaultValue={form.getValues("status") || ""}
          disabled={createUserAdminMutation.isPending}
        >
          <SelectTrigger id="inline-status">
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
            <SelectItem value="DELETED">Deleted</SelectItem>
          </SelectContent>
        </Select>
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
        <Input
          id="inline-statusReason"
          type="text"
          disabled={createUserAdminMutation.isPending}
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
            onCancel?.();
          }}
          disabled={createUserAdminMutation.isPending}
        >
          {isAlwaysOpen ? "Clear" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={createUserAdminMutation.isPending || !isValid}
        >
          {createUserAdminMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {createUserAdminMutation.isPending ? "Creating..." : "Create User"}
        </Button>
      </div>
    </form>
  );
}
