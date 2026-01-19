import { UserProfilePage } from "@/components/pages/userProfile/UserProfilePage";

export default async function page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <UserProfilePage username={username} />;
}
