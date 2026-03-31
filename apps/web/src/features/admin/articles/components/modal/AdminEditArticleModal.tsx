import { AdminInlineEditArticleForm } from "../AdminInlineEditArticleForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { Article } from "../../types/article";

export function AdminEditArticleModal({ data }: { data: Article }) {
  const { closeModal } = useModal();

  return (
    <AdminInlineEditArticleForm
      articleData={data}
      onSuccess={() => {
        toast.success("Successfully edited article");
        closeModal();
      }}
      onCancel={() => {
        toast.error("Error trying to edit article");
      }}
      isAlwaysOpen={true}
    />
  );
}
