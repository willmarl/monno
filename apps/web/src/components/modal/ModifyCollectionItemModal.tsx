"use client";

import { Button } from "@/components/ui/button";
import { useModal } from "@/components/providers/ModalProvider";
import { RESOURCE_TYPES } from "@/types/resource";
import { InlineNewCollectionForm } from "@/features/collections/components/InlineNewCollectionForm";
import { toast } from "sonner";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import {
  useCollectionsByUserId,
  useCollectionsForPost,
} from "@/features/collections/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useState, useEffect } from "react";
import {
  useAddCollectionItem,
  useRemoveCollectionItem,
} from "@/features/collections/hooks";

interface ModifyCollectionItemModalProps {
  postId: number;
}

const LIMIT = 10;

export function ModifyCollectionItemModal({
  postId,
}: ModifyCollectionItemModalProps) {
  const { closeModal } = useModal();
  const { data: user } = useSessionUser();
  const [page, setPage] = useState(1);
  const { data: userCollections, isLoading } = useCollectionsByUserId(
    user?.id ?? 0,
    page,
    LIMIT,
  );
  const { data: collectionsWithPost } = useCollectionsForPost(postId);
  const addItem = useAddCollectionItem();
  const removeItem = useRemoveCollectionItem();
  const [checkedCollections, setCheckedCollections] = useState<Set<number>>(
    new Set(),
  );

  // Update checked collections when data loads
  useEffect(() => {
    if (collectionsWithPost) {
      setCheckedCollections(new Set(collectionsWithPost.map((c) => c.id)));
    }
  }, [collectionsWithPost]);

  const handleCollectionToggle = (collectionId: number, checked: boolean) => {
    const newChecked = new Set(checkedCollections);

    if (checked) {
      newChecked.add(collectionId);
      addItem.mutate(
        {
          collectionId,
          data: { resourceType: RESOURCE_TYPES.POST, resourceId: postId },
        },
        {
          onSuccess: () => {
            setCheckedCollections(newChecked);
            toast.success("Post added to collection");
          },
          onError: (err) => {
            toast.error(`Failed to add post: ${err.message}`);
          },
        },
      );
    } else {
      newChecked.delete(collectionId);
      removeItem.mutate(
        {
          collectionId,
          data: { resourceType: RESOURCE_TYPES.POST, resourceId: postId },
        },
        {
          onSuccess: () => {
            setCheckedCollections(newChecked);
            toast.success("Post removed from collection");
          },
          onError: (err) => {
            toast.error(`Failed to remove post: ${err.message}`);
          },
        },
      );
    }
  };

  const collections = userCollections?.items ?? [];
  const totalItems =
    userCollections?.pageInfo?.total ??
    userCollections?.pageInfo?.totalItems ??
    0;

  return (
    <div className="flex flex-col gap-4">
      <InlineNewCollectionForm
        onSuccess={() => {
          toast.success("Collection created successfully");
        }}
        onError={() => {
          toast.error("Failed to create collection");
        }}
        isAlwaysOpen={false}
      />
      <Separator />

      <PaginatedListInline
        page={page}
        limit={LIMIT}
        items={collections}
        totalItems={totalItems}
        isLoading={isLoading}
        onPageChange={setPage}
        renderItem={(collection) => (
          <FieldLabel className="flex items-center gap-2">
            <Checkbox
              checked={checkedCollections.has(collection.id)}
              onCheckedChange={(checked) =>
                handleCollectionToggle(collection.id, checked === true)
              }
              disabled={addItem.isPending || removeItem.isPending}
            />
            {collection.name}
          </FieldLabel>
        )}
        title="Your Collections"
        layout="flex"
        gridClassName="flex flex-col gap-3"
        emptyMessage="No collections yet."
      />

      <Button onClick={closeModal} className="mt-2 w-full">
        Done
      </Button>
    </div>
  );
}
