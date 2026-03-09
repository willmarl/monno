import { AdminCollectionPage } from "@/components/pages/admin/collections/AdminCollectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collections",
};
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
  const params = await searchParams;
  return <AdminCollectionPage searchParams={params} />;
}
