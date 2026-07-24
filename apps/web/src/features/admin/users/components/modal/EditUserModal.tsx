"use client";

import { EditUserAdminForm } from "@/features/admin/users/components/EditUserAdminForm";
import { User } from "@/features/users/types/user";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function EditUserModal({ user }: { user: User }) {
  const { closeModal } = useModal();

  return (
    <EditUserAdminForm
      user={user}
      onSuccess={() => {
        toast.success(`Edited ${user.username} successfully`);
        closeModal();
      }}
      onError={(err) => {
        const message =
          typeof err?.message === "string" && err.message.trim()
            ? err.message
            : Array.isArray(err?.message)
              ? err.message.join(", ")
              : `Error trying to edit ${user.username}`;
        toast.error(message);
      }}
      isAlwaysOpen={true}
    />
  );
}
