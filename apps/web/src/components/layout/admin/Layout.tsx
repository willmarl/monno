"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { items } from "./Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const currentPage =
    items.find((item) => {
      const itemPath = item.url.split("?")[0];
      return pathname === itemPath;
    })?.title || "Admin";

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col w-full">
        <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b h-14 flex items-center justify-between px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">{currentPage}</h1>
          <img src="/favicon.ico" alt="Logo" className="h-8 w-8 rounded" />
        </header>
        <main className="w-full md:mt-0 mt-14">{children}</main>
      </div>
    </SidebarProvider>
  );
}
