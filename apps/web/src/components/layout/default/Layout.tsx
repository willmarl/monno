import Header from "./Header";
import Footer from "./Footer";
import { getServerUser } from "@/features/auth/server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1 container mx-auto p-4">{children}</main>
      <Footer />
    </div>
  );
}
