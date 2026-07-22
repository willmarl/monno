import { getServerUser } from "@/features/auth/server";
import { ArticleDetail } from "@/components/pages/article/ArticleDetail";
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
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await fetch(`${serverApiUrl()}/articles/${id}`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return { title: "Article Detail" };
    }

    const jsonResponse = await response.json();
    const articleTitle =
      jsonResponse?.data?.title || jsonResponse?.title || "Article";

    return {
      title: articleTitle,
    };
  } catch {
    return {
      title: "Article Detail",
    };
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function page({ params }: PageProps) {
  const user = await getServerUser();
  const { id } = await params;

  return <ArticleDetail user={user} />;
}
