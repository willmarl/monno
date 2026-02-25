"use client";

import { useCollectionById } from "@/features/collections/hooks";
import { Pencil, Trash } from "lucide-react";
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

  if (isLoading) return <PageLoadingState variant="card" />;

  if (!data || error) return <PageNotFound title="Collection Not Found" />;

  const formatted = formatDate(data?.createdAt);

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex justify-between">
          <p>{data?.name}</p>
          <p
            className="cursor-pointer"
            onClick={() => {
              router.push(`/user/${data?.creator.username}`);
            }}
          >
            {data?.creator.username}
          </p>
        </div>
        <div className="flex justify-between">
          <p>{data?.description}</p>
          {isOwner ? (
            <div className="flex gap-1">
              <Button
                onClick={() => {
                  openModal({
                    title: "Delete Collection",
                    content: <DeleteCollection data={data} />,
                  });
                }}
              >
                <Trash />
              </Button>
              <Button
                onClick={() => {
                  openModal({
                    title: "Edit Collection",
                    content: <EditCollection data={data} />,
                  });
                }}
              >
                <Pencil />
              </Button>
            </div>
          ) : (
            ""
          )}
        </div>
        <p>{formatted}</p>
      </div>
      <Separator />
      <Suspense fallback={<p>Loading...</p>}>
        <CollectionItemsList
          collectionId={id}
          creator={data.creator}
          isOwner={isOwner}
        />
      </Suspense>
    </div>
  );
}
