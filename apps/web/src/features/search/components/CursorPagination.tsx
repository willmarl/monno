"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface CursorPaginationProps {
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
}

/**
 * Generic cursor pagination component
 * Simple "Load More" / "Next" button for cursor-based pagination
 * Works with any resource (posts, videos, articles, etc.)
 */
export function CursorPagination({
  hasNextPage,
  isFetching,
  onLoadMore,
}: CursorPaginationProps) {
  if (!hasNextPage) {
    return null;
  }

  return (
    <div className="flex justify-center py-8">
      <Button
        onClick={onLoadMore}
        disabled={isFetching}
        variant="outline"
        size="lg"
      >
        {isFetching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            Load More
            <ChevronRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
