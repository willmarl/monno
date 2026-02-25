import { InlineNewCollectionForm } from "@/features/collections/components/InlineNewCollectionForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function NewCollection() {
  const { closeModal } = useModal();

  return (
    <InlineNewCollectionForm
      onSuccess={() => {
        toast.success("NewCollection successfully");
        closeModal();
      }}
      onCancel={() => {
        toast.error("NewCollection failed");
      }}
      isAlwaysOpen={true}
    />
  );
}
