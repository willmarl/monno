export interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  isValid: boolean;
  // Geolocation fields
  location?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  // Risk scoring fields
  riskScore?: number;
  isNewLocation?: boolean;
  isNewDevice?: boolean;
}
