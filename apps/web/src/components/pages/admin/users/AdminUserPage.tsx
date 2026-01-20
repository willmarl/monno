"use client";

import { columns } from "@/components/pages/admin/users/columns";
import { DataTable } from "@/components/ui/data-table";
import { User } from "@/features/users/types/user";
import { useUsersAdmin } from "@/features/users/hooks";

export function AdminUserPage() {
  const { data, isLoading, isFetching, error } = useUsersAdmin(1, 10);
  console.log(data);

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
      <DataTable columns={columns} data={data.items} />
    </div>
  );
}
