"use client";

import { useFetchUserByUsername } from "@/features/users/hooks";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserProfileContent } from "./UserProfileContent";
import { UserProfileHeader } from "./UserProfileHeader";
import { useSessionUser } from "@/features/auth/hooks";
import Link from "next/link";

function LoadingState() {
  return (
    <Card className="p-8">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Separator />
        <Skeleton className="h-40 w-full" />
      </div>
    </Card>
  );
}

function UserNotFound() {
  return (
    <Card className="p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">User Not Found</h1>
        <p className="text-muted-foreground">
          The user you are looking for does not exist.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </Card>
  );
}

export function UserProfilePage({ username }: { username: string }) {
  const { data: currentUser } = useSessionUser();
  const { data: user, isLoading, error } = useFetchUserByUsername(username);
  const isOwner = currentUser?.id == user?.id;

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !user) {
    return <UserNotFound />;
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
