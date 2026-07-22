"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SearchTab = "posts" | "collections" | "users";

interface SearchTabsProps {
  activeTab: SearchTab;
}

const TAB_PATH: Record<SearchTab, string> = {
  posts: "/",
  collections: "/collections",
  users: "/users",
};

export function SearchTabs({ activeTab }: SearchTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const handleTabChange = (tab: SearchTab) => {
    const basePath = TAB_PATH[tab];
    const url = query ? `${basePath}?q=${encodeURIComponent(query)}` : basePath;
    router.push(url);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => handleTabChange(val as SearchTab)}
    >
      <TabsList variant="line" className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="collections">Collections</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
