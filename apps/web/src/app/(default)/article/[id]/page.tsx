import { getServerUser } from "@/features/auth/server";
import { ArticleDetail } from "@/components/pages/article/ArticleDetail";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/articles/${id}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const jsonResponse = await response.json();
    const articleTitle =
      jsonResponse?.data?.title || jsonResponse?.title || "Article";

    return {
      title: articleTitle,
    };
  } catch (error) {
    console.error("Error in generateMetadata for article:", error);
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
