import { InlineUpdateCollectionForm } from "@/features/collections/components/InlineUpdateCollectionForm";
import { useModal } from "@/components/modal/ModalProvider";
import { toast } from "sonner";
import { Collection } from "@/features/collections/types/collection";

export function EditCollection({ data }: { data: Collection }) {
  const { closeModal } = useModal();

  return (
    <InlineUpdateCollectionForm
      data={data}
      onSuccess={() => {
        toast.success("Successfully edit collection");
        closeModal();
      }}
      onCancel={() => {
        toast.error("Error trying to edit collection");
      }}
      isAlwaysOpen={true}
    />
  );
}
