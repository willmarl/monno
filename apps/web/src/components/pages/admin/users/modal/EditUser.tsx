"use client";

import { InlineUpdateUserAdminForm } from "@/features/users/components/InlineUpdateUserAdminForm";
import { User } from "@/features/users/types/user";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function EditUser({ user }: { user: User }) {
  const { closeModal } = useModal();

  return (
    <InlineUpdateUserAdminForm
      user={user}
      onSuccess={() => {
        toast.success(`Editted ${user.username} successfully`);
        closeModal();
      }}
      onCancel={() => {
        toast.error(`Error trying to edit ${user.username}`);
      }}
      isAlwaysOpen={true}
    />
  );
}
