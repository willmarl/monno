import { Card } from "./card";
import { FolderPlus } from "lucide-react";
import { Collection } from "@/features/collections/types/collection";
import { useRouter } from "next/navigation";

export function CollectionCard({
  data,
  isOwner,
}: {
  data: Collection;
  isOwner: boolean;
}) {
  const router = useRouter();
  // isOwner is here just incase, technically not needed
  return (
    <Card
      onClick={() => router.push(`/collection/${data.id}`)}
      className="w-50 p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95"
    >
      <div className="flex items-center gap-2 mb-2">
        <FolderPlus className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
        <h3 className="font-semibold text-sm truncate">{data?.name}</h3>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {data?.description}
      </p>
    </Card>
  );
}
