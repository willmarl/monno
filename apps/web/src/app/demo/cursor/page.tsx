"use client";

import { Suspense } from "react";
import { PostSearchBar } from "@/features/posts/components/PostSearchBar";
import { CursorPostsContent } from "../../../components/pages/demo/CursorPostsContent";

interface CursorPageProps {
  searchParams?: {
    q?: string;
    searchFields?: string;
    sort?: string;
    caseSensitive?: string;
  };
}

export default function CursorPage({ searchParams }: CursorPageProps) {
  return (
    <div className="p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Cursor Pagination Demo</h1>
          <Suspense fallback={<p>Loading search...</p>}>
            <PostSearchBar basePath="/demo/cursor" />
          </Suspense>
        </div>
        <CursorPostsContent searchParams={searchParams} />
      </div>
    </div>
  );
}
