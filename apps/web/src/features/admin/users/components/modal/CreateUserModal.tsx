import { InlineCreateUserAdminForm } from "@/features/admin/users/components/InlineCreateUserAdminForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function CreateUserModal() {
  const { closeModal } = useModal();

  return (
    <InlineCreateUserAdminForm
      onSuccess={() => {
        toast.success("Successfully made user");
        closeModal();
      }}
      onError={() => {
        toast.error("Error trying to make user");
      }}
      isAlwaysOpen={true}
    />
  );
}
