"use client";

import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@/features/users/types/user";

interface UserAvatarProps {
  user: User | { username: string; avatarPath?: string };
}

export function UserAvatar({ user }: UserAvatarProps) {
  const initials = user.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Avatar path is now stored as full URL from backend
  const avatarUrl = user.avatarPath || null;

  return (
    <Link href="/profile" title="Edit profile">
      <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={user.username} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
