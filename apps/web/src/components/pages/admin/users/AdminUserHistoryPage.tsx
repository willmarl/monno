"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { ProfileListSearch } from "@/components/pages/userProfile/ProfileListSearch";
import { useAdminViewHistory, useAdminUserById } from "@/features/users/hooks";
import type { AdminViewHistoryItem } from "@/features/users/types/user";
import { formatDate } from "@/lib/utils/date";

const DEFAULT_LIMIT = 10;

type HistoryStatus = "all" | "active" | "cleared";
type ResourceTab = "POST" | "ARTICLE";

function HistoryRow({ item }: { item: AdminViewHistoryItem }) {
  const title = item.resource?.title ?? `Deleted ${item.resourceType.toLowerCase()} #${item.resourceId}`;
  const href =
    item.resource && !item.resource.deleted
      ? item.resourceType === "POST"
        ? `/post/${item.resourceId}`
        : `/article/${item.resourceId}`
      : null;

  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {href ? (
            <Link href={href} className="font-medium hover:underline">
              {title}
            </Link>
          ) : (
            <span className="font-medium text-muted-foreground">{title}</span>
          )}
          {item.deleted && <Badge variant="secondary">Cleared by user</Badge>}
          {item.resource?.deleted && (
            <Badge variant="outline">Resource deleted</Badge>
          )}
          {item.resource?.visibility === "PRIVATE" && (
            <Badge variant="outline">Private</Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {item.resourceType} #{item.resourceId}
          {item.resource?.creator?.username
            ? ` · by ${item.resource.creator.username}`
            : ""}
        </div>
      </div>
      <div className="shrink-0 text-sm text-muted-foreground">
        Viewed {formatDate(item.viewedAt)}
        {item.deletedAt ? ` · cleared ${formatDate(item.deletedAt)}` : ""}
      </div>
    </div>
  );
}

function HistoryTab({
  userId,
  resourceType,
}: {
  userId: number;
  resourceType: ResourceTab;
}) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<HistoryStatus>("all");

  const { data, isLoading } = useAdminViewHistory(
    userId,
    resourceType,
    page,
    DEFAULT_LIMIT,
    query,
    status,
  );

  const items = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ProfileListSearch
          placeholder={`Search viewed ${resourceType === "POST" ? "posts" : "articles"}…`}
          value={query}
          onChange={(q) => {
            setQuery(q);
            setPage(1);
          }}
        />
        <div className="mb-3 flex gap-1">
          {(["all", "active", "cleared"] as HistoryStatus[]).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={status === value ? "default" : "outline"}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {value === "all"
                ? "All"
                : value === "active"
                  ? "Active"
                  : "Cleared"}
            </Button>
          ))}
        </div>
      </div>
      <PaginatedListInline
        page={page}
        limit={DEFAULT_LIMIT}
        items={items.map((item) => ({ ...item, id: item.historyId }))}
        totalItems={totalItems}
        isLoading={isLoading}
        onPageChange={setPage}
        title=""
        layout="flex"
        gridClassName="flex flex-col"
        emptyMessage={
          query
            ? `No history matching “${query}”.`
            : "No view history for this filter."
        }
        renderItem={(item) => <HistoryRow item={item} />}
      />
    </div>
  );
}

export function AdminUserHistoryPage({ userId }: { userId: number }) {
  const router = useRouter();
  const [tab, setTab] = useState<ResourceTab>("POST");
  const { data: user } = useAdminUserById(userId);
  const username = user?.username;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/users")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Users
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            View history
            {username ? ` · ${username}` : ` · user #${userId}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Includes entries the user cleared (soft-deleted) for audit.
          </p>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as ResourceTab)}
      >
        <TabsList variant="line" className="mb-4 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="POST">Posts</TabsTrigger>
          <TabsTrigger value="ARTICLE">Articles</TabsTrigger>
        </TabsList>
        <TabsContent value="POST">
          <HistoryTab userId={userId} resourceType="POST" />
        </TabsContent>
        <TabsContent value="ARTICLE">
          <HistoryTab userId={userId} resourceType="ARTICLE" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
