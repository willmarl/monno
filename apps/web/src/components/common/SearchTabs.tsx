"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchTabsProps {
  activeTab: "posts" | "users";
}

export function SearchTabs({ activeTab }: SearchTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const handleTabChange = (tab: "posts" | "users") => {
    const basePath = tab === "posts" ? "/" : "/users";
    const url = query ? `${basePath}?q=${encodeURIComponent(query)}` : basePath;
    router.push(url);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => handleTabChange(val as "posts" | "users")}
    >
      <TabsList variant="line" className="grid w-full max-w-xs grid-cols-2">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
