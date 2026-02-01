import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils/date";
import { User as UserType } from "@/features/users/types/user";
import { useRouter } from "next/navigation";

export function User({ data }: { data: UserType }) {
  const router = useRouter();

  if (!data) return null;

  return (
    <Card
      onClick={() => router.push(`/user/${data.id}`)}
      className="p-3 hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="text-sm font-semibold">
            {data.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{data.username}</p>
          <p className="text-xs text-slate-500">
            Joined {formatDate(String(data.createdAt))}
          </p>
        </div>
      </div>
    </Card>
  );
}
