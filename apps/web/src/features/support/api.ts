import { fetcher } from "@/lib/fetcher";
import type {
  SupportTicketList,
  SupportTicket,
  CreateSupportTicketInput,
  UpdateSupportTicketInput,
} from "./types/support";

export const createSupportTicket = (data: CreateSupportTicketInput) =>
  fetcher<SupportTicket>("/support", {
    method: "POST",
    json: data,
  });

//==============
//   Admin
//==============

export const fetchSupportTicketById = (id: number) =>
  fetcher<SupportTicket>(`/admin/support/${id}`);

export const fetchSupportTickets = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;

  return fetcher<SupportTicketList>("/admin/support", { searchParams });
};

export const updateSupportTicket = (
  id: number,
  data: UpdateSupportTicketInput,
) =>
  fetcher<SupportTicket>(`/admin/support/${id}`, {
    method: "PATCH",
    json: data,
  });
