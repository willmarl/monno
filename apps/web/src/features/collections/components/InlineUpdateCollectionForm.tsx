"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateCollectionSchema,
  UpdateCollectionInput,
} from "../schemas/updateCollection.schema";
import { useUpdateCollection } from "../hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Collection } from "../types/collection";

interface InlineUpdateCollectionFormProps {
  data: Collection;
  onSuccess?: () => void;
  onCancel?: () => void;
  isAlwaysOpen?: boolean;
}

export function InlineUpdateCollectionForm({
  data: collectionData,
  onSuccess,
  onCancel,
  isAlwaysOpen = false,
}: InlineUpdateCollectionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<UpdateCollectionInput>({
    resolver: zodResolver(updateCollectionSchema),
    mode: "onChange",
    defaultValues: {
      name: collectionData.name,
      description: collectionData.description,
    },
  });

  const updateCollectionMutation = useUpdateCollection();
  const { isValid } = form.formState;
  console.log(collectionData);
  const handleSubmit = (data: UpdateCollectionInput) => {
    updateCollectionMutation.mutate(
      { id: collectionData.id, data },
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
        Change UpdateCollection
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
          disabled={updateCollectionMutation.isPending}
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
        <Input
          id="inline-description"
          type="text"
          placeholder="description"
          disabled={updateCollectionMutation.isPending}
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
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={updateCollectionMutation.isPending}
        >
          {isAlwaysOpen ? "Clear" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={updateCollectionMutation.isPending || !isValid}
        >
          {updateCollectionMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {updateCollectionMutation.isPending
            ? "Loading..."
            : "SUBMIT | CHANGE ME"}
        </Button>
      </div>
    </form>
  );
}
