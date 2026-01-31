import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { UserStats } from "@/features/admin/types";

interface UsersStatsWidgetProps {
  data?: UserStats;
}

export function UsersStatsWidget({ data }: UsersStatsWidgetProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{data?.total ?? 0}</p>
          </div>
        </div>
        <Badge variant="outline" className="ml-auto">
          Active: {data?.byStatus.active ?? 0}
        </Badge>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm">Active</span>
          </div>
          <span className="font-semibold">{data?.byStatus.active ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm">Suspended</span>
          </div>
          <span className="font-semibold">{data?.byStatus.suspended ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Banned</span>
          </div>
          <span className="font-semibold">{data?.byStatus.banned ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm">Unverified Emails</span>
          </div>
          <span className="font-semibold">{data?.unverifiedEmails ?? 0}</span>
        </div>
      </div>
    </Card>
  );
}
