import { getServerUser } from "@/features/auth/server";
import { PostDetail } from "@/components/pages/post/PostDetail";
import { serverApiUrl } from "@/lib/serverApiUrl";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    // Server fetch does not forward browser cookies via credentials alone —
    // private posts need the session Cookie header so owners get a title.
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await fetch(`${serverApiUrl()}/posts/${id}`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return { title: "Post Detail" };
    }

    const jsonResponse = await response.json();
    const postTitle =
      jsonResponse?.data?.title || jsonResponse?.title || "Post";

    return {
      title: postTitle,
    };
  } catch {
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
