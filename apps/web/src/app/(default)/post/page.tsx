import { DefaultPostPage } from "@/components/pages/default/DefaultPostPage";
import { getServerUser } from "@/features/auth/server";

export default async function page() {
  const user = await getServerUser();

  return <DefaultPostPage user={user} />;
}
