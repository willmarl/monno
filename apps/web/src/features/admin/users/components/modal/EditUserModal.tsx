"use client";

import { InlineEditUserAdminForm } from "@/features/admin/users/components/InlineEditUserAdminForm";
import { User } from "@/features/users/types/user";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function EditUserModal({ user }: { user: User }) {
  const { closeModal } = useModal();

  return (
    <InlineEditUserAdminForm
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
