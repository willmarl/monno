import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { EditPostAdminForm } from "@/features/admin/posts/components/EditPostAdminForm";
import { Post } from "@/features/posts/types/post";

export function EditPostModal({ post }: { post: Post }) {
  const { closeModal } = useModal();

  return (
    <EditPostAdminForm
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
