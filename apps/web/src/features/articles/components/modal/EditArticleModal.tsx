import { EditArticleForm } from "../EditArticleForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { Article } from "../../types/article";

export function EditArticleModal({ data }: { data: Article }) {
  const { closeModal } = useModal();

  return (
    <EditArticleForm
      articleData={data}
      onSuccess={() => {
        closeModal();
      }}
      onCancel={() => {
        toast.info("Reset form");
      }}
      onError={() => {
        toast.error("Error trying to edit article");
      }}
      isAlwaysOpen={true}
    />
  );
}
