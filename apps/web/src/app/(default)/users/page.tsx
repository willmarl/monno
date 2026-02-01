import { UsersPage } from "@/components/pages/users/UsersPage";
import { PublicUserSearchParams } from "@/types/search-params";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<PublicUserSearchParams>;
}) {
  const params = await searchParams;

  return <UsersPage searchParams={params} />;
}
