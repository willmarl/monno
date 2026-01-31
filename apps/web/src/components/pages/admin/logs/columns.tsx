"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/components/table/SortableHeader";
import { formatDate } from "@/lib/utils/date";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/features/admin/types/audit";

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

export const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
    size: 50,
  },
  {
    accessorKey: "action",
    header: ({ column }) => <SortableHeader column={column} label="Action" />,
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      return (
        <Badge variant="outline" className={getActionColor(action)}>
          {getActionLabel(action)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "resource",
    header: ({ column }) => <SortableHeader column={column} label="Resource" />,
    cell: ({ row }) => {
      const resource = row.getValue("resource") as string;
      return <div className="text-sm">{resource}</div>;
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <SortableHeader column={column} label="Description" />
    ),
    cell: ({ row }) => {
      const description = (row.getValue("description") as string) ?? "—";
      const truncated =
        description.length > 40
          ? description.slice(0, 37) + "..."
          : description;
      return (
        <div
          className="max-w-xs truncate text-sm"
          title={description !== "—" ? description : undefined}
        >
          {truncated}
        </div>
      );
    },
  },
  {
    accessorKey: "admin.username",
    header: ({ column }) => <SortableHeader column={column} label="Admin" />,
    cell: ({ row }) => {
      const admin = row.original.admin;
      return admin ? (
        <div className="flex gap-2 items-center">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{admin.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{admin.username}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Unknown</span>
      );
    },
  },
  {
    accessorKey: "target.username",
    header: ({ column }) => <SortableHeader column={column} label="Target" />,
    cell: ({ row }) => {
      const target = row.original.target;
      return target ? (
        <div className="flex gap-2 items-center">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{target.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{target.username}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Created At" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("createdAt"));
      const formatted = formatDate(date);
      return <div className="text-sm">{formatted}</div>;
    },
  },
  {
    accessorKey: "ipAddress",
    header: ({ column }) => (
      <SortableHeader column={column} label="IP Address" />
    ),
    cell: ({ row }) => {
      const ip = (row.getValue("ipAddress") as string) ?? "—";
      return (
        <div className="text-sm text-muted-foreground font-mono text-xs">
          {ip}
        </div>
      );
    },
  },
];
