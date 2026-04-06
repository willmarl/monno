import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { Collection } from "@/features/collections/types/collection";
import { InlineEditCollectionAdminForm } from "@/features/admin/collections/components/InlineEditCollectionAdminForm";

export function EditCollectionModal({ collection }: { collection: Collection }) {
  const { closeModal } = useModal();

  return (
    <InlineEditCollectionAdminForm
      data={collection}
      onSuccess={() => {
        toast.success("Successfully updated collection");
        closeModal();
      }}
      onError={() => {
        toast.error("Error trying to update collection");
      }}
      isAlwaysOpen={true}
    />
  );
}
