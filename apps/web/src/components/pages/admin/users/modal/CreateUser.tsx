import { InlineCreateUserAdminForm } from "@/features/users/components/InlineCreateUserAdminForm";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function CreateUser() {
  const { closeModal } = useModal();

  return (
    <InlineCreateUserAdminForm
      onSuccess={() => {
        toast.success("Successfully made user");
        closeModal();
      }}
      onCancel={() => {
        toast.error("Error trying to make user");
      }}
      isAlwaysOpen={true}
    />
  );
}
