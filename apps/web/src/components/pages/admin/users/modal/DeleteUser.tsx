"use client";
import { User } from "@/features/users/types/user";
import { Button } from "@/components/ui/button";
import { useAdminDeleteUser } from "@/features/users/hooks";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export function DeleteUser({ user }: { user: User }) {
  const deleteUser = useAdminDeleteUser();
  const { closeModal } = useModal();

  function handleClick(): void {
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success(`Successfully deleted user ${user.username}`);
      },
      onError: (err) => {
        toast.error(`Failed to delete user. ${err.message}`);
      },
    });
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
