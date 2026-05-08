import { NewCollectionForm } from "@/features/collections/components/NewCollectionForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NewCollectionModal() {
  const { closeModal } = useModal();
  const router = useRouter();

  return (
    <NewCollectionForm
      onSuccess={(response) => {
        toast.success("New Collection created successfully");
        closeModal();
        router.push(`/collection/${response.id}`); // assuming response has an id
      }}
      onError={(err) => {
        toast.error(err.message);
      }}
      isAlwaysOpen={true}
    />
  );
}
