import { InlineEditArticleForm } from "../InlineEditArticleForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { Article } from "../../types/article";

export function EditArticleModal({ data }: { data: Article }) {
  const { closeModal } = useModal();

  return (
    <InlineEditArticleForm
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
