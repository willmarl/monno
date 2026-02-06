import { Card } from "./card";
import { FolderPlus } from "lucide-react";
import { Collection } from "@/features/collections/types/collection";

export function CollectionCard({
  data,
  isOwner,
}: {
  data: Collection;
  isOwner: boolean;
}) {
  // isOwner is here just incase, technically not needed
  return (
    <Card className="w-50 p-2 gap-0 cursor-pointer">
      <div className="flex justify-between">
        <FolderPlus />
        <p>{data?.name}</p>
      </div>
      <p>{data?.description}</p>
    </Card>
  );
}
