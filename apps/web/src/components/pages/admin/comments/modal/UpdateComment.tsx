import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { InlineUpdateCommentAdminForm } from "@/features/admin/comments/components/InlineUpdateCommentAdminForm";
import { Comment } from "@/features/comments/types/comment";

export function UpdateComment({ comment }: { comment: Comment }) {
  const { closeModal } = useModal();

  return (
    <InlineUpdateCommentAdminForm
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
