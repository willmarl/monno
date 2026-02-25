"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User } from "@/features/users/types/user";
import { PaginatedPosts } from "./PaginatedPostsContent";
import { PostSearchBar } from "@/features/posts/components/PostSearchBar";
import { SearchTabs } from "@/components/common/SearchTabs";
import { PublicPostSearchParams } from "@/types/search-params";

interface DefaultPostPageProps {
  user: User | null;
  searchParams?: PublicPostSearchParams;
}

export function DefaultPostPage({ user, searchParams }: DefaultPostPageProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex flex-col items-center gap-4 mb-4 relative">
        <SearchTabs activeTab="posts" />
        <div className="flex ">
          <PostSearchBar basePath="/" />
          {user ? (
            <Button
              className="cursor-pointer absolute right-0"
              onClick={() => router.push("/post/create")}
            >
              <Plus /> Post
            </Button>
          ) : (
            ""
          )}
        </div>
      </div>
      <PaginatedPosts searchParams={searchParams} />
    </div>
  );
}
