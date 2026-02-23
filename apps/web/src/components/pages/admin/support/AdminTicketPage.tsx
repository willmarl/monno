import { TicketSearchBar } from "@/features/support/components/TicketSearchBar";
import { AdminSupportTicketSearchParams } from "@/types/search-params";
import { TicketDataTable } from "./TicketDataTable";

interface AdminTicketPageProps {
  searchParams?: AdminSupportTicketSearchParams;
}

export function AdminTicketPage({ searchParams }: AdminTicketPageProps) {
  return (
    <div>
      <TicketSearchBar basePath="/admin/support" />
      <TicketDataTable searchParams={searchParams} />
    </div>
  );
}
