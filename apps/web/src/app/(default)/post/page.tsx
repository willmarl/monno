import { DefaultPostPage } from "@/components/pages/default/DefaultPostPage";
import { getServerUser } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts",
};
export default async function page() {
  const user = await getServerUser();

  return <DefaultPostPage user={user} />;
}
