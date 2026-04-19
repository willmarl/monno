import { getServerUser } from "@/features/auth/server";
import { PostDetail } from "@/components/pages/post/PostDetail";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/posts/${id}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.status}`);
    }

    const jsonResponse = await response.json();
    const postTitle =
      jsonResponse?.data?.title || jsonResponse?.title || "Post";

    return {
      title: postTitle,
    };
  } catch (error) {
    console.error("Error in generateMetadata for post:", error);
    return {
      title: "Post Detail",
    };
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function page({ params }: PageProps) {
  const user = await getServerUser();
  const { id } = await params;

  return <PostDetail user={user} />;
}
