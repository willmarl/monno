import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  createSupportTicket,
  fetchSupportTickets,
  fetchSupportTicketById,
  updateSupportTicket,
} from "./api";

export function useCreateSupportTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-ticket"] });
    },
  });
}

//==============
//   Admin
//==============

export function useSupportTicketById(id: number) {
  return useQuery({
    queryKey: ["support-ticket", id],
    queryFn: () => fetchSupportTicketById(id),
    enabled: !!id,
  });
}

export function useSupporTicket(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: { searchFields?: string; sort?: string; caseSensitive?: boolean },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "support-ticket",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
    ],
    queryFn: () =>
      fetchSupportTickets({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
      }),
  });
}

export function useUpdateSupportTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateSupportTicket>[1];
    }) => updateSupportTicket(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["support-ticket"] });
      qc.invalidateQueries({ queryKey: ["support-ticket", id] });
    },
  });
}
