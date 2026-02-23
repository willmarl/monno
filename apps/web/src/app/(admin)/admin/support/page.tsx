import { AdminTicketPage } from "@/components/pages/admin/support/AdminTicketPage";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    searchFields?: string;
    sort?: string;
    page?: string;
    limit?: string;
    caseSensitive?: string;
  }>;
}) {
  const params = await searchParams;
  return <AdminTicketPage searchParams={params} />;
}
