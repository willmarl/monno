import { columns } from "@/components/pages/admin/users/columns";
import { DataTable } from "@/components/ui/data-table";
import { User } from "@/features/users/types/user";

export default function page() {
  const data = [
    {
      id: 14,
      username: "cat",
      role: "ADMIN",
    },
    {
      id: 15,
      username: "foo",
      role: "USER",
    },
  ];
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
