import { EditPostPage } from "@/components/pages/post/EditPostPage";
import { requireAuth } from "@/features/auth/server";
import { serverApiUrl } from "@/lib/serverApiUrl";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Post",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function page({ params }: PageProps) {
  const user = await requireAuth();
  const { id } = await params;

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
    notFound();
  }

  const json = await response.json();
  const creatorId = json?.data?.creator?.id;
  if (creatorId !== user.id) {
    redirect("/unauthorized");
  }

  return <EditPostPage />;
}
