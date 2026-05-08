import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { EditCommentAdminForm } from "@/features/admin/comments/components/EditCommentAdminForm";
import { Comment } from "@/features/comments/types/comment";

export function EditCommentModal({ comment }: { comment: Comment }) {
  const { closeModal } = useModal();

  return (
    <EditCommentAdminForm
      data={comment}
      onSuccess={() => {
        toast.success("Successfully updated comment");
        closeModal();
      }}
      onError={() => {
        toast.error("Error trying to update comment");
      }}
      isAlwaysOpen={true}
    />
  );
}
