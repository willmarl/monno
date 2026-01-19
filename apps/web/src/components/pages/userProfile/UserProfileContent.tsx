import { PublicUser } from "@/features/users/types/user";

interface UserProfileContentProps {
  user: PublicUser;
}

export function UserProfileContent({ user }: UserProfileContentProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Posts</h2>
        <p className="text-muted-foreground text-sm mt-2">
          {user.username}'s posts will appear here
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No posts yet</p>
      </div>
    </div>
  );
}
