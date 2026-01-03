export interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  isValid: boolean;
}
