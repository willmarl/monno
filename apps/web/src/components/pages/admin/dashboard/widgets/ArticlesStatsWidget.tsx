import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  FileEdit,
  CheckCircle2,
  Archive,
  Clock,
  XCircle,
} from "lucide-react";
import { ArticleStats } from "@/features/admin/types";

interface ArticlesStatsWidgetProps {
  data?: ArticleStats;
}

export function ArticlesStatsWidget({ data }: ArticlesStatsWidgetProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Articles</p>
            <p className="text-2xl font-bold">{data?.total ?? 0}</p>
          </div>
        </div>
        <Badge variant="outline" className="ml-auto">
          Active: {data?.active ?? 0}
        </Badge>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Draft</span>
          </div>
          <span className="font-semibold">{data?.byStatus.draft ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm">Published</span>
          </div>
          <span className="font-semibold">{data?.byStatus.published ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Archived</span>
          </div>
          <span className="font-semibold">{data?.byStatus.archived ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Scheduled</span>
          </div>
          <span className="font-semibold">{data?.byStatus.scheduled ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Deleted</span>
          </div>
          <span className="font-semibold">{data?.deleted ?? 0}</span>
        </div>

        {data?.total ? (
          <div className="pt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Deletion Rate</span>
              <span>{data.deletionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${data.deletionRate}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
