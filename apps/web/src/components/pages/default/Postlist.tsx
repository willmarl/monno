import { usePosts } from "@/features/posts/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { Post } from "@/components/ui/Post";

export function Postlist() {
  const { data, isLoading, isFetching } = usePosts();
  const { data: user } = useSessionUser();
  // todo forture me: pagaination
  return (
    <div className="flex flex-col gap-4">
      {data?.items?.map((post) => (
        <Post
          key={post.id}
          data={post}
          isOwner={post.creator.id === user?.id}
        />
      ))}
    </div>
  );
}
