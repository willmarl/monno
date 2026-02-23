import { PaginatedResponse } from "@/types/pagination";

interface UserInfo {
  id: number;
  username: string;
  avatarPath: string;
}

export type SupportTicketStatus = "OPEN" | "CLOSED" | "RESPONDED";

export interface SupportTicket {
  id: number;
  title: string;
  message: string;
  adminNotes: string;
  status: SupportTicketStatus;
  email: string;
  user: UserInfo;
  createdAt: string;
  updatedAt: string;
}

export type SupportTicketList = PaginatedResponse<SupportTicket>;

export interface CreateSupportTicketInput {
  title: string;
  message: string;
  email?: string;
}

export interface UpdateSupportTicketInput {
  status: SupportTicketStatus;
  adminNotes?: string;
}
