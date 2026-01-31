"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User } from "@/features/users/types/user";
import { PaginatedPosts } from "./PaginatedPostsContent";
import { PostSearchBar } from "@/features/posts/components/PostSearchBar";
import { PublicPostSearchParams } from "@/types/search-params";

interface DefaultPostPageProps {
  user: User | null;
  searchParams?: PublicPostSearchParams;
}

export function DefaultPostPage({ user, searchParams }: DefaultPostPageProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex justify-center relative items-center h-10 mb-4">
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
      <PaginatedPosts searchParams={searchParams} />
    </div>
  );
}
