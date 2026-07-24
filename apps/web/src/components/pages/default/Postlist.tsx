import { usePosts } from "@/features/posts/hooks";
import { Post } from "@/components/ui/Post";

export function Postlist() {
  const { data, isLoading, isFetching } = usePosts();
  // todo forture me: pagaination
  return (
    <div className="flex flex-col gap-4">
      {data?.items?.map((post) => (
        <Post key={post.id} data={post} />
      ))}
    </div>
  );
}
