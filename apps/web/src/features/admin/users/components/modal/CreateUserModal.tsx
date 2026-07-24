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
      onError={(err) => {
        const message =
          typeof err?.message === "string" && err.message.trim()
            ? err.message
            : Array.isArray(err?.message)
              ? err.message.join(", ")
              : "Error trying to make user";
        toast.error(message);
      }}
      isAlwaysOpen={true}
    />
  );
}
