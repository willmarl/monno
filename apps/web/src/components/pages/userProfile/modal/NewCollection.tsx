import { InlineNewCollectionForm } from "@/features/collections/components/InlineNewCollectionForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NewCollection() {
  const { closeModal } = useModal();
  const router = useRouter();

  return (
    <InlineNewCollectionForm
      onSuccess={(response) => {
        toast.success("New Collection created successfully");
        closeModal();
        router.push(`/collection/${response.id}`); // assuming response has an id
      }}
      onError={() => {
        toast.error("New Collection failed create");
      }}
      isAlwaysOpen={true}
    />
  );
}
