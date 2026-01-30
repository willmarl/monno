"use client";

import { Button } from "@/components/ui/button";
import { AdminUserSearchBar } from "@/features/admin/users/components/AdminUserSearchBar";
import { UserDataTable } from "./UserDataTable";
import { useModal } from "@/components/modal/ModalProvider";
import { CreateUser } from "./modal/CreateUser";

interface AdminUserPageProps {
  searchParams?: {
    q?: string;
    searchFields?: string;
    sort?: string;
    page?: string;
    limit?: string;
    caseSensitive?: string;
    roles?: string;
    status?: string;
  };
}

export function AdminUserPage({ searchParams }: AdminUserPageProps) {
  const { openModal } = useModal();

  return (
    <div className="container mx-auto py-10">
      <div className="flex gap-2 mb-6">
        <AdminUserSearchBar basePath="/admin/users" />
        <Button
          onClick={() => {
            openModal({
              title: "Create new user",
              content: <CreateUser />,
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
