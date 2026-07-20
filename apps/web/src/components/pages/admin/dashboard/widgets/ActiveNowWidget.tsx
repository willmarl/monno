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
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-950">
          <Activity className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Active now</p>
          <p className="text-2xl font-bold">{data?.activeNow ?? 0}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        approx · {formatWindow(data?.windowSeconds)} · logged-in users
      </p>
    </Card>
  );
}
