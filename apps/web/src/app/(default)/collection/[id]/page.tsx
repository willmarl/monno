import { CollectionPage } from "@/components/pages/collection/CollectionPage";

export default async function page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  return <CollectionPage id={id} />;
}
