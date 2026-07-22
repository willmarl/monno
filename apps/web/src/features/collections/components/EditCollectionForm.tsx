"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editCollectionSchema,
  EditCollectionInput,
} from "../schemas/editCollection.schema";
import { useUpdateCollection } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Collection } from "../types/collection";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";

interface EditCollectionFormProps {
  data: Collection;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

/**
 * Form for Editing collection.
 *
 * Handles submission. Importer must handle:
 * - Success toast via onSuccess callback
 * - Navigation/close via onSuccess callback (if needed)
 * - Error handling via onError callback
 *
 * isAlwaysOpen=false: renders as collapsible toggle button.
 * isAlwaysOpen=true: renders form immediately (for modals/pages).
 */
export function EditCollectionForm({
  data: collectionData,
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: EditCollectionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<EditCollectionInput>({
    resolver: zodResolver(editCollectionSchema),
    mode: "onChange",
    defaultValues: {
      name: collectionData.name,
      description: collectionData.description,
      visibility: collectionData.visibility ?? "PRIVATE",
    },
  });

  const editCollectionMutation = useUpdateCollection();
  const { isValid } = form.formState;
  const handleSubmit = (data: EditCollectionInput) => {
    editCollectionMutation.mutate(
      { id: collectionData.id, data },
      {
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
      },
    );
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Edit Collection
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* name */}
      <div className="space-y-2">
        <Label htmlFor="inline-name" className="text-sm">
          Name
        </Label>
        <Input
          id="inline-name"
          type="text"
          placeholder="name"
          disabled={editCollectionMutation.isPending}
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* description */}
      <div className="space-y-2">
        <Label htmlFor="inline-description" className="text-sm">
          Description
        </Label>
        <Textarea
          id="inline-description"
          placeholder="description"
          disabled={editCollectionMutation.isPending}
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-red-500">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Visibility</Label>
        <Controller
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <Select
              value={field.value ?? "PRIVATE"}
              onValueChange={field.onChange}
              disabled={editCollectionMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
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
          disabled={editCollectionMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={editCollectionMutation.isPending || !isValid}
          className="cursor-pointer"
        >
          {editCollectionMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {editCollectionMutation.isPending ? "Saving..." : "Save collection"}
        </Button>
      </div>
    </form>
  );
}
