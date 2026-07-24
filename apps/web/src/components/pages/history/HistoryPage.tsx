"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Post } from "@/components/ui/Post";
import { Article } from "@/components/ui/Article";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { ProfileListSearch } from "@/components/pages/userProfile/ProfileListSearch";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { useModal } from "@/components/providers/ModalProvider";
import {
  useViewHistory,
  useRemoveViewHistoryEntry,
  useClearViewHistory,
} from "@/features/views/hook";
import type {
  ViewableResourceType,
  ViewHistoryArticleItem,
  ViewHistoryPostItem,
} from "@/features/views/types/view";

const DEFAULT_LIMIT = 9;

export function HistoryPage() {
  const [tab, setTab] = useState<ViewableResourceType>("POST");
  const [postPage, setPostPage] = useState(1);
  const [articlePage, setArticlePage] = useState(1);
  const [postQuery, setPostQuery] = useState("");
  const [articleQuery, setArticleQuery] = useState("");
  const { openModal, closeModal } = useModal();
  const removeEntry = useRemoveViewHistoryEntry();
  const clearHistory = useClearViewHistory();

  const postsQuery = useViewHistory("POST", postPage, DEFAULT_LIMIT, postQuery);
  const articlesQuery = useViewHistory(
    "ARTICLE",
    articlePage,
    DEFAULT_LIMIT,
    articleQuery,
  );

  const confirmClear = (resourceType: ViewableResourceType) => {
    const label = resourceType === "POST" ? "posts" : "articles";
    openModal({
      title: "Clear history",
      content: (
        <ConfirmModal
          message={`Clear your viewed ${label} history? Entries are hidden from you but kept for audit.`}
          buttonMessage="Clear"
          variant="destructive"
          showCancelButton
          onCancel={closeModal}
          onConfirm={() =>
            clearHistory.mutate(resourceType, {
              onSuccess: (data) => {
                closeModal();
                toast.success(
                  data.cleared
                    ? `Cleared ${data.cleared} ${label} from history`
                    : "History already empty",
                );
                if (resourceType === "POST") setPostPage(1);
                else setArticlePage(1);
              },
              onError: (error) => {
                toast.error("Failed to clear history: " + error.message);
              },
            })
          }
        />
      ),
    });
  };

  const confirmRemove = (historyId: number, title: string) => {
    openModal({
      title: "Remove from history",
      content: (
        <ConfirmModal
          message={`Remove “${title}” from your view history?`}
          buttonMessage="Remove"
          variant="destructive"
          showCancelButton
          onCancel={closeModal}
          onConfirm={() =>
            removeEntry.mutate(historyId, {
              onSuccess: () => {
                closeModal();
                toast.success("Removed from history");
              },
              onError: (error) => {
                toast.error("Failed to remove: " + error.message);
              },
            })
          }
        />
      ),
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">
            Posts and articles you have viewed recently.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => confirmClear(tab)}
          disabled={clearHistory.isPending}
        >
          Clear {tab === "POST" ? "posts" : "articles"} history
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as ViewableResourceType)}
      >
        <TabsList variant="line" className="mb-4 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="POST">Posts</TabsTrigger>
          <TabsTrigger value="ARTICLE">Articles</TabsTrigger>
        </TabsList>

        <TabsContent value="POST" className="space-y-3">
          <ProfileListSearch
            placeholder="Search viewed posts…"
            value={postQuery}
            onChange={(q) => {
              setPostQuery(q);
              setPostPage(1);
            }}
          />
          <PaginatedListInline
            page={postPage}
            limit={DEFAULT_LIMIT}
            items={(postsQuery.data?.items ?? []) as ViewHistoryPostItem[]}
            totalItems={
              postsQuery.data?.pageInfo?.total ??
              postsQuery.data?.pageInfo?.totalItems ??
              0
            }
            isLoading={postsQuery.isLoading}
            onPageChange={setPostPage}
            title="Viewed posts"
            layout="grid"
            emptyMessage={
              postQuery
                ? `No viewed posts matching “${postQuery}”.`
                : "No viewed posts yet."
            }
            renderItem={(item) => (
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2 z-10 h-8 w-8 p-0"
                  title="Remove from history"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmRemove(item.historyId, item.title);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Post data={item} />
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="ARTICLE" className="space-y-3">
          <ProfileListSearch
            placeholder="Search viewed articles…"
            value={articleQuery}
            onChange={(q) => {
              setArticleQuery(q);
              setArticlePage(1);
            }}
          />
          <PaginatedListInline
            page={articlePage}
            limit={DEFAULT_LIMIT}
            items={
              (articlesQuery.data?.items ?? []) as ViewHistoryArticleItem[]
            }
            totalItems={
              articlesQuery.data?.pageInfo?.total ??
              articlesQuery.data?.pageInfo?.totalItems ??
              0
            }
            isLoading={articlesQuery.isLoading}
            onPageChange={setArticlePage}
            title="Viewed articles"
            layout="grid"
            emptyMessage={
              articleQuery
                ? `No viewed articles matching “${articleQuery}”.`
                : "No viewed articles yet."
            }
            renderItem={(item) => (
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2 z-10 h-8 w-8 p-0"
                  title="Remove from history"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmRemove(item.historyId, item.title);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Article data={item} />
              </div>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
