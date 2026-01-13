import { CursorInfinitePost } from "@/components/pages/default/CursorInfinitePost";

export default function InfinitePostsPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Infinite Scroll Demo</h1>
      <CursorInfinitePost />
    </div>
  );
}
