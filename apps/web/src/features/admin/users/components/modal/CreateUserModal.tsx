import { CreateUserAdminForm } from "@/features/admin/users/components/CreateUserAdminForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function CreateUserModal() {
  const { closeModal } = useModal();

  return (
    <CreateUserAdminForm
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
