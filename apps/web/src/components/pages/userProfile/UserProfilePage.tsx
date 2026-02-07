"use client";

import { useFetchUserByUsername } from "@/features/users/hooks";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserProfileContent } from "./UserProfileContent";
import { UserProfileHeader } from "./UserProfileHeader";
import { useSessionUser } from "@/features/auth/hooks";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { PageNotFound } from "@/components/common/PageNotFound";

export function UserProfilePage({ username }: { username: string }) {
  const { data: currentUser } = useSessionUser();
  const { data: user, isLoading, error } = useFetchUserByUsername(username);
  const isOwner = currentUser?.id == user?.id;

  if (isLoading) {
    return <PageLoadingState variant="profile" />;
  }

  if (error || !user) {
    return <PageNotFound title="User Not Found" />;
  }

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <UserProfileHeader user={user} isOwner={isOwner} />
        <Separator className="my-6" />
        <UserProfileContent user={user} isOwner={isOwner} />
      </Card>
    </div>
  );
}
