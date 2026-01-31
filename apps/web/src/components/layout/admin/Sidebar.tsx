"use client";

import { LayoutDashboard, Users, FileText, Logs } from "lucide-react";
import { useSessionUser } from "@/features/auth/hooks";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { SideBarUser } from "./SidebarUser";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

// Menu items.
export const items = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    // url: "/admin/users",
    url: "/admin/users?sort=createdAt%7Casc&statuses=ACTIVE%2CSUSPENDED%2CBANNED",
    icon: Users,
  },
  {
    title: "Posts",
    url: "/admin/posts",
    icon: FileText,
  },
  {
    title: "Logs",
    url: "/admin/logs",
    icon: Logs,
  },
];

export function AppSidebar() {
  const { data: user, isLoading } = useSessionUser();
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-start">
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter
        className={`flex gap-2 ${state === "collapsed" ? "flex-col" : "flex-row items-center"}`}
      >
        <ThemeToggle />
        {user ? <SideBarUser user={user} /> : "Skeleton here"}
      </SidebarFooter>
    </Sidebar>
  );
}
