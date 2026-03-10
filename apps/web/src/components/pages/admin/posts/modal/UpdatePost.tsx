import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";
import { InlineUpdatePostAdminForm } from "@/features/admin/posts/components/InlineUpdatePostAdminForm";
import { Post } from "@/features/posts/types/post";

export function UpdatePost({ post }: { post: Post }) {
  const { closeModal } = useModal();

  return (
    <InlineUpdatePostAdminForm
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
