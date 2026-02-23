"use client";

import {
  LayoutDashboard,
  Users,
  FileText,
  Logs,
  MessageSquare,
  CreditCard,
  Contact,
} from "lucide-react";
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
import { useStripeHealth } from "@/features/stripe/hooks";

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
    title: "Comments",
    url: "/admin/comments",
    icon: MessageSquare,
  },
  {
    title: "Logs",
    url: "/admin/logs",
    icon: Logs,
  },
  {
    title: "Support",
    url: "/admin/support",
    icon: Contact,
  },
];

export const stripeItems = [
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Products Purchased",
    url: "/admin/products-purchased",
    icon: CreditCard,
  },
  {
    title: "Credit Purchases",
    url: "/admin/credit-purchases",
    icon: CreditCard,
  },
  {
    title: "Credit Transactions",
    url: "/admin/credit-transactions",
    icon: CreditCard,
  },
];

export function AppSidebar() {
  const { data: user, isLoading } = useSessionUser();
  const { data: health } = useStripeHealth();
  const { state } = useSidebar();

  const allItems = health ? [...items, ...stripeItems] : items;

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
              {allItems.map((item) => (
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
