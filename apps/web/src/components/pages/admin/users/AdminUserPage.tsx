"use client";

import { columns } from "@/components/pages/admin/users/columns";
import { DataTable } from "@/components/ui/data-table";
import { User } from "@/features/users/types/user";
import { useUsersAdmin } from "@/features/users/hooks";
import { useModal } from "@/components/modal/ModalProvider";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { CreateUser } from "./modal/CreateUser";
import { Button } from "@/components/ui/button";

interface AdminUserPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export function AdminUserPage({ searchParams }: AdminUserPageProps) {
  // Parse page and limit from search params
  const page = Math.max(1, parseInt((searchParams?.page as string) || "1", 10));
  const limit = Math.max(
    1,
    parseInt((searchParams?.limit as string) || "10", 10),
  );

  const { data, isLoading, isFetching, error } = useUsersAdmin(page, limit);
  const { openModal } = useModal();

  if (isLoading) {
    return <div>Loading...</div>;
    // replace me with skeleton later
  }

  if (error || !data) {
    return (
      <div>Something went wrong. could not pull users. {error?.message}</div>
    );
  }

  return (
    <div className="container mx-auto py-10">
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
      <DataTable columns={columns} data={data.items} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/users"
          page={page}
          limit={limit}
          totalItems={data.pageInfo.totalItems}
        />
      </div>
    </div>
  );
}
