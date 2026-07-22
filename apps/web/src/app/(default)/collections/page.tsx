import { CollectionsBrowsePage } from "@/components/pages/collection/CollectionsBrowsePage";
import { PublicCollectionSearchParams } from "@/types/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collections",
};

export default async function page({
  searchParams,
}: {
  searchParams: Promise<PublicCollectionSearchParams>;
}) {
  const params = await searchParams;
  return <CollectionsBrowsePage searchParams={params} />;
}
