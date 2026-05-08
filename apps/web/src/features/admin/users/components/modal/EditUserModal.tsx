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
      onError={() => {
        toast.error(`Error trying to edit ${user.username}`);
      }}
      isAlwaysOpen={true}
    />
  );
}
