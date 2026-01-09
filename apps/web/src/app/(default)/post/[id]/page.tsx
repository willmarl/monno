import { Post } from "@/components/ui/Post";

export default async function page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  return (
    <div className="max-w-2xl mx-auto">
      <Post id={id} />
    </div>
  );
}
