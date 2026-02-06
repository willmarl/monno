"use client";
import { Collection } from "@/features/collections/types/collection";
import { Button } from "@/components/ui/button";
import { useDeleteCollection } from "@/features/collections/hooks";
import { useModal } from "@/components/modal/ModalProvider";
import { toast } from "sonner";

export function DeleteCollection({ data }: { data: Collection }) {
  const deleteData = useDeleteCollection();
  const { closeModal } = useModal();

  function handleClick(): void {
    deleteData.mutate(data.id, {
      onSuccess: () => {
        toast.success(`Successfully deleted ${data.name}`);
      },
      onError: (err) => {
        toast.error(`Failed to delete data. ${err.message}`);
      },
    });
    closeModal();
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        Are you sure you want to delete <b>{data.name}</b>?
      </p>
      <Button
        className="cursor-pointer"
        variant={"destructive"}
        onClick={handleClick}
      >
        Yes
      </Button>
    </div>
  );
}
