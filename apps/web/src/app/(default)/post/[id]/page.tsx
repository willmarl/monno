import { getServerUser } from "@/features/auth/server";
import { SpecificPost } from "@/components/pages/post/SpecificPost";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts",
};
export default async function page() {
  const user = await getServerUser();

  return <SpecificPost user={user} />;
}
