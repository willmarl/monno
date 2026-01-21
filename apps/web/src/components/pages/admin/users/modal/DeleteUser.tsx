"use client";
import { User } from "@/features/users/types/user";
import { Button } from "@/components/ui/button";
import { useDeleteUserAdmin } from "@/features/users/hooks";
import { useModal } from "@/components/modal/ModalProvider";

export function DeleteUser({ user }: { user: User }) {
  const deleteUser = useDeleteUserAdmin();
  const { closeModal } = useModal();

  function handleClick(): void {
    deleteUser.mutate(user.id);
    closeModal();
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        Are you sure you want to delete <b>{user.username}</b>?
      </p>
      <Button
        className="cursor-pointer"
        variant={"destructive"}
        onClick={handleClick}
      >
        Yes
      </Button>
    </div>
  );
}
