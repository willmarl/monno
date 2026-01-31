"use client";

import { useStats } from "@/features/admin/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersStatsWidget } from "./widgets/UsersStatsWidget";
import { PostsStatsWidget } from "./widgets/PostsStatsWidget";
import { SystemStatsWidget } from "./widgets/SystemStatsWidget";
import { RecentActivityWidget } from "./widgets/RecentActivityWidget";

export function AdminDashboardPage() {
  const { data, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 md:col-span-2" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform's statistics and activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SystemStatsWidget data={data?.system} />
        <UsersStatsWidget data={data?.users} />
        <PostsStatsWidget data={data?.posts} />
        <RecentActivityWidget />
      </div>
    </div>
  );
}
