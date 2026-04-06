"use client";

import { Button } from "@/components/ui/button";
import { AdminUserSearchBar } from "@/features/admin/users/components/AdminUserSearchBar";
import { UserDataTable } from "./UserDataTable";
import { useModal } from "@/components/providers/ModalProvider";
import { CreateUserModal } from "@/features/admin/users/components/modal/CreateUserModal";
import { AdminUserSearchParams } from "@/types/search-params";

interface AdminUserPageProps {
  searchParams?: AdminUserSearchParams;
}

export function AdminUserPage({ searchParams }: AdminUserPageProps) {
  const { openModal } = useModal();

  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <div className="flex gap-2 mb-6">
        <AdminUserSearchBar basePath="/admin/users" />
        <Button
          onClick={() => {
            openModal({
              title: "Create new user",
              content: <CreateUserModal />,
            });
          }}
        >
          Create User
        </Button>
      </div>
      <UserDataTable searchParams={searchParams} />
    </div>
  );
}
