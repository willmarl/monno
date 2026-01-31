import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLogs } from "@/features/admin/hooks";
import { Activity, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const actionColors: Record<string, string> = {
  USER_CREATED: "bg-green-100 text-green-800",
  USER_UPDATED: "bg-blue-100 text-blue-800",
  USER_DELETED: "bg-red-100 text-red-800",
  USER_BANNED: "bg-red-100 text-red-800",
  USER_SUSPENDED: "bg-yellow-100 text-yellow-800",
  POST_CREATED: "bg-green-100 text-green-800",
  POST_DELETED: "bg-red-100 text-red-800",
  POST_UPDATED: "bg-blue-100 text-blue-800",
};

const getActionColor = (action: string) => {
  return actionColors[action] || "bg-gray-100 text-gray-800";
};

const getActionLabel = (action: string) => {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export function RecentActivityWidget() {
  const PAGE = 1,
    LIMIT = 5;
  const { data, isLoading } = useLogs(PAGE, LIMIT);

  if (isLoading) {
    return (
      <Card className="p-6 md:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const logs = data?.items || [];

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          Last {logs.length} actions
        </span>
      </div>

      <div className="space-y-1">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={log.id}>
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${getActionColor(log.action)}`}
                  >
                    {getActionLabel(log.action)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {log.admin?.username || `Admin #${log.adminId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.description || `${log.resource} #${log.resourceId}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
              {index < logs.length - 1 && <Separator />}
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}
      </div>
    </Card>
  );
}
