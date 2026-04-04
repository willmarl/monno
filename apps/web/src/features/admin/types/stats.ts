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
  active: number;
  deleted: number;
  deletionRate: number;
}

export interface ArticleStats {
  total: number;
  active: number;
  byStatus: {
    draft: number;
    published: number;
    archived: number;
    scheduled: number;
  };
  deleted: number;
  deletionRate: number;
}

export interface DashboardStats {
  system: SystemStats;
  users: UserStats;
  posts: PostStats;
  articles: ArticleStats;
  timestamp: string;
}
