import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { InlineEditCommentAdminForm } from "@/features/admin/comments/components/InlineEditCommentAdminForm";
import { Comment } from "@/features/comments/types/comment";

export function EditCommentModal({ comment }: { comment: Comment }) {
  const { closeModal } = useModal();

  return (
    <InlineEditCommentAdminForm
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
