import { DefaultPostPage } from "@/components/pages/default/DefaultPostPage";
import { getServerUser } from "@/features/auth/server";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    searchFields?: string;
    sort?: string;
    page?: string;
    limit?: string;
    caseSensitive?: string;
  }>;
}) {
  const user = await getServerUser();
  const params = await searchParams;

  return <DefaultPostPage user={user} searchParams={params} />;
}
