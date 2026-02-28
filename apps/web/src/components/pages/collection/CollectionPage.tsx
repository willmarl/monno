"use client";

import { useCollectionById } from "@/features/collections/hooks";
import { Pencil, Trash, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/date";
import { CollectionItemsList } from "./CollectionItemsList";
import { Suspense } from "react";
import { useSessionUser } from "@/features/auth/hooks";
import { useModal } from "@/components/providers/ModalProvider";
import { DeleteCollection } from "./modal/DeleteCollection";
import { EditCollection } from "./modal/EditCollection";
import { useRouter } from "next/navigation";
import { PageNotFound } from "@/components/common/PageNotFound";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { useEffect } from "react";
interface CollectionPageProps {
  id: number;
  isOwner?: boolean;
}

export function CollectionPage({ id }: CollectionPageProps) {
  const router = useRouter();
  const { data: user } = useSessionUser();
  const { data, isLoading, error } = useCollectionById(id);
  const { openModal } = useModal();
  const isOwner = data?.creator.id === user?.id;
  useEffect(() => {
    document.title = `${data?.name || "Collection"} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
  }, [data?.name]);

  if (isLoading) return <PageLoadingState variant="card" />;

  if (!data || error) return <PageNotFound title="Collection Not Found" />;

  const formatted = formatDate(data?.createdAt);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold">{data?.name}</h1>
              <p className="text-muted-foreground line-clamp-3">
                {data?.description}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    openModal({
                      title: "Edit Collection",
                      content: <EditCollection data={data} />,
                    });
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  // variant="destructive"
                  size="icon"
                  onClick={() => {
                    openModal({
                      title: "Delete Collection",
                      content: <DeleteCollection data={data} />,
                    });
                  }}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <Separator />

          <div className="flex flex-wrap gap-6 text-sm">
            <button
              onClick={() => {
                router.push(`/user/${data?.creator.username}`);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="w-4 h-4" />
              <span>{data?.creator.username}</span>
            </button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatted}</span>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <Suspense
          fallback={<p className="text-muted-foreground">Loading items...</p>}
        >
          <CollectionItemsList
            collectionId={id}
            creator={data.creator}
            isOwner={isOwner}
          />
        </Suspense>
      </div>
    </div>
  );
}
