import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { InlineEditPostAdminForm } from "@/features/admin/posts/components/InlineEditPostAdminForm";
import { Post } from "@/features/posts/types/post";

export function EditPostModal({ post }: { post: Post }) {
  const { closeModal } = useModal();

  return (
    <InlineEditPostAdminForm
      data={post}
      onSuccess={() => {
        toast.success("Successfully updated post");
        closeModal();
      }}
      onError={() => {
        toast.error("Error trying to update post");
      }}
      isAlwaysOpen={true}
    />
  );
}
