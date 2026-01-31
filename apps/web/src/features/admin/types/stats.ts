export interface SystemStats {
  cpuUsage: number;
  ramUsage: number;
  totalRamGb: number;
  usedRamGb: number;
  uptime: number;
  cpuCores: number;
}

export interface UserStats {
  total: number;
  byStatus: {
    active: number;
    suspended: number;
    banned: number;
    deleted: number;
  };
  unverifiedEmails: number;
}

export interface PostStats {
  total: number;
  published: number;
  deleted: number;
}

export interface DashboardStats {
  system: SystemStats;
  users: UserStats;
  posts: PostStats;
  timestamp: string;
}
