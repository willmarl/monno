import { PaginatedResponse } from "@/types/pagination";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
}

export interface AuditLog {
  id: number;
  adminId: number;
  action: string;
  resource: string;
  resourceId?: string;
  targetId?: number;
  description?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
  admin: AdminUser;
  target?: AdminUser;
}

export type AuditLogList = PaginatedResponse<AuditLog>;
