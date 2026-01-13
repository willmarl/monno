"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfinitePaginationProps {
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
}

/**
 * Generic infinite scroll pagination component
 * Uses Intersection Observer to auto-load more when user scrolls to bottom
 * Works with any resource (posts, videos, articles, etc.)
 */
export function InfinitePagination({
  hasNextPage,
  isFetching,
  onLoadMore,
}: InfinitePaginationProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Don't set up observer if no more pages or already fetching
    if (!hasNextPage || !observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetching, onLoadMore]);

  if (!hasNextPage && !isFetching) {
    return null;
  }

  return (
    <div ref={observerTarget} className="flex justify-center py-8">
      {isFetching && (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-600">Loading more...</span>
        </div>
      )}
    </div>
  );
}
