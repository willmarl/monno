import { DefaultPostPage } from "@/components/pages/default/DefaultPostPage";
import { getServerUser } from "@/features/auth/server";
import { PublicPostSearchParams } from "@/types/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts",
};

export default async function page({
  searchParams,
}: {
  searchParams: Promise<PublicPostSearchParams>;
}) {
  const user = await getServerUser();
  const params = await searchParams;

  return <DefaultPostPage user={user} searchParams={params} />;
}
