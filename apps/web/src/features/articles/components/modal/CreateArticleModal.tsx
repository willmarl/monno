import { InlineCreateArticleForm } from "../InlineCreateArticleForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function CreateArticleModal() {
  const { closeModal } = useModal();

  return (
    <InlineCreateArticleForm
      onSuccess={() => {
        toast.success("Successfully made article");
        closeModal();
      }}
      onCancel={() => {
        toast.info("Reset form");
      }}
      onError={() => {
        toast.error("Error trying to make article");
      }}
      isAlwaysOpen={true}
    />
  );
}
