import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { Collection } from "@/features/collections/types/collection";
import { InlineUpdateCollectionAdminForm } from "@/features/admin/collections/components/InlineUpdateCollectionAdminForm";

export function UpdateCollection({ collection }: { collection: Collection }) {
  const { closeModal } = useModal();

  return (
    <InlineUpdateCollectionAdminForm
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
