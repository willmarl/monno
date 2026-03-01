"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PublicUser } from "@/features/users/types/user";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
interface UserProfileHeaderProps {
  user: PublicUser;
  isOwner: boolean;
}

function formatJoinedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
}

export function UserProfileHeader({ user, isOwner }: UserProfileHeaderProps) {
  const router = useRouter();
  const joinedText = formatJoinedDate(user.createdAt);

  const handleSettings = () => {
    router.push("/settings");
  };

  const initials = user.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-start">
      {/* Profile Avatar */}
      <Avatar className="h-16 md:h-24 w-16 md:w-24 flex-shrink-0">
        {user.avatarPath && (
          <AvatarImage src={user.avatarPath} alt={user.username} />
        )}
        <AvatarFallback className="text-lg md:text-2xl">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 w-full flex flex-col">
        <h1 className="text-xl md:text-3xl font-bold text-foreground break-words">
          {user.username}
        </h1>
        <div className="mt-2 md:mt-4 flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs md:text-sm">Joined {joinedText}</span>
        </div>
        {isOwner && (
          <div className="mt-4">
            <Button onClick={handleSettings} className="w-full md:w-auto">
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
