import { TicketSearchBar } from "@/features/admin/support/components/TicketSearchBar";
import { AdminSupportTicketSearchParams } from "@/types/search-params";
import { TicketDataTable } from "./TicketDataTable";

interface AdminTicketPageProps {
  searchParams?: AdminSupportTicketSearchParams;
}

export function AdminTicketPage({ searchParams }: AdminTicketPageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <TicketSearchBar basePath="/admin/support" />
      <TicketDataTable searchParams={searchParams} />
    </div>
  );
}
