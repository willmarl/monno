"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  newCollectionSchema,
  NewCollectionInput,
} from "../schemas/newCollection.schema";
import { useCreateCollection } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronUp, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface InlineNewCollectionFormProps {
  onSuccess?: (response: any) => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

export function InlineNewCollectionForm({
  onSuccess,
  onCancel,
  onError,

  isAlwaysOpen = false,
}: InlineNewCollectionFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<NewCollectionInput>({
    resolver: zodResolver(newCollectionSchema),
    mode: "onChange",
    defaultValues: {
      description: "",
      name: "",
    },
  });

  const newCollectionMutation = useCreateCollection();

  const { isValid } = form.formState;

  const handleSubmit = (data: NewCollectionInput) => {
    newCollectionMutation.mutate(data, {
      onSuccess: (response) => {
        form.reset();
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.(response);
      },
      onError: (err) => {
        onError?.(err);
      },
    });
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Plus /> New Collection
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* Input fields here*/}
      {/* name */}
      <div className="space-y-2">
        <Label htmlFor="inline-name" className="text-sm">
          Name
        </Label>
        <Input
          id="inline-name"
          type="text"
          placeholder="name"
          disabled={newCollectionMutation.isPending}
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
          Description (optional)
        </Label>
        <Textarea
          id="inline-description"
          placeholder="description"
          disabled={newCollectionMutation.isPending}
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-red-500">
            {form.formState.errors.description.message}
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
          disabled={newCollectionMutation.isPending}
        >
          {isAlwaysOpen ? (
            "Clear"
          ) : (
            <div className="flex items-center gap-1">
              <ChevronUp /> Collapse
            </div>
          )}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={newCollectionMutation.isPending || !isValid}
          className="cursor-pointer"
        >
          {newCollectionMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {newCollectionMutation.isPending
            ? "Creating..."
            : "Create collection"}
        </Button>
      </div>
    </form>
  );
}
