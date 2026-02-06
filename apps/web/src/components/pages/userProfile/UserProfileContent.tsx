"use client";

import { Suspense } from "react";
import { UsersPostsList } from "./UsersPostsList";
import { LikedPostsList } from "./LikedPostsList";
import { CollectionsList } from "./CollectionsList";
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
        <LikedPostsList user={user} isOwner={isOwner} />
        <CollectionsList user={user} isOwner={isOwner} />
      </Suspense>
    </div>
  );
}
