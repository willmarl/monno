import { AdminCreateArticleForm } from "../AdminCreateArticleForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function AdminCreateArticleModal() {
  const { closeModal } = useModal();

  return (
    <AdminCreateArticleForm
      onSuccess={() => {
        toast.success("Successfully created article");
        closeModal();
      }}
      onCancel={() => {
        toast.info("Reset form");
      }}
      onError={() => {
        toast.error("Error trying to create article");
      }}
      isAlwaysOpen={true}
    />
  );
}
