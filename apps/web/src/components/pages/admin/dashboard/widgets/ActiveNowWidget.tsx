import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { PresenceStats } from "@/features/admin/types";

interface ActiveNowWidgetProps {
  data?: PresenceStats;
}

function formatWindow(windowSeconds?: number): string {
  if (!windowSeconds || windowSeconds <= 0) return "last 5 min";
  if (windowSeconds < 60) return `last ${windowSeconds}s`;
  const minutes = Math.round(windowSeconds / 60);
  return `last ${minutes} min`;
}

export function ActiveNowWidget({ data }: ActiveNowWidgetProps) {
  const users = data?.users ?? 0;
  const guests = data?.guests ?? 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-950">
          <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Active now</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-bold tabular-nums leading-none">
              {data?.activeNow ?? 0}
            </p>
            <p className="text-xs font-medium tabular-nums leading-none">
              <span className="text-sky-600 dark:text-sky-400">
                {users} user{users === 1 ? "" : "s"}
              </span>
              <span className="text-muted-foreground mx-1">·</span>
              <span className="text-amber-600 dark:text-amber-400">
                {guests} guest{guests === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        approx · {formatWindow(data?.windowSeconds)}
      </p>
    </Card>
  );
}
