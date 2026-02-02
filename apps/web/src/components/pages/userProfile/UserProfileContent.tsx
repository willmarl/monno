"use client";

import { Suspense } from "react";
import { UsersPostsList } from "./UsersPostsList";
import { LikedPostsList } from "./LikedPostsList";
import { PublicUser } from "@/features/users/types/user";

interface UserProfileContentProps {
  user: PublicUser;
  isOwner: boolean;
}

export function UserProfileContent({ user, isOwner }: UserProfileContentProps) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<p>Loading...</p>}>
        <UsersPostsList user={user} isOwner={isOwner} />
      </Suspense>
      <Suspense fallback={<p>Loading...</p>}>
        <LikedPostsList user={user} isOwner={isOwner} />
      </Suspense>
    </div>
  );
}
