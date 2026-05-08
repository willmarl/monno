import { EditCollectionForm } from "@/features/collections/components/EditCollectionForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { Collection } from "@/features/collections/types/collection";

export function EditCollectionModal({ data }: { data: Collection }) {
  const { closeModal } = useModal();

  return (
    <EditCollectionForm
      data={data}
      onSuccess={() => {
        toast.success("Successfully edit collection");
        closeModal();
      }}
      onError={(err) => {
        toast.error(err.message);
      }}
      isAlwaysOpen={true}
    />
  );
}
