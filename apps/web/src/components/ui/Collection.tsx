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
      className="w-50 p-2 gap-0 cursor-pointer"
    >
      <div className="flex justify-between">
        <FolderPlus />
        <p>{data?.name}</p>
      </div>
      <p>{data?.description}</p>
    </Card>
  );
}
