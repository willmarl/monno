import { Post } from "@/components/ui/Post";
export function Postlist() {
  return (
    <div className="flex flex-col gap-4">
      <Post />
      <Post />
      <Post />
    </div>
  );
}
