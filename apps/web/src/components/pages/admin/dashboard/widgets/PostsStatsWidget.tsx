import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, CheckCircle2, XCircle } from "lucide-react";
import { PostStats } from "@/features/admin/types";

interface PostsStatsWidgetProps {
  data?: PostStats;
}

export function PostsStatsWidget({ data }: PostsStatsWidgetProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Posts</p>
            <p className="text-2xl font-bold">{data?.total ?? 0}</p>
          </div>
        </div>
        <Badge variant="outline" className="ml-auto">
          Published: {data?.published ?? 0}
        </Badge>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm">Published</span>
          </div>
          <span className="font-semibold">{data?.published ?? 0}</span>
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
              <span>
                {(((data.deleted || 0) / data.total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{
                  width: `${((data.deleted || 0) / data.total) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
