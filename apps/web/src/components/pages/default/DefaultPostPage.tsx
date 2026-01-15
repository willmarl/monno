"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User } from "@/features/users/types/user";
import { PaginatedPosts } from "./PaginatedPosts";
import { PostSearchBar } from "@/features/posts/components/PostSearchBar";

interface DefaultPostPageProps {
  user: User | null;
  searchParams?: {
    q?: string;
    searchFields?: string;
    sort?: string;
    page?: string;
    limit?: string;
    caseSensitive?: string;
  };
}

export function DefaultPostPage({ user, searchParams }: DefaultPostPageProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex justify-center relative items-center h-10 mb-4">
        <PostSearchBar />
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
