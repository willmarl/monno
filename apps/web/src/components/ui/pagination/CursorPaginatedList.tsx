"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface Props<T> {
  items: T[];
  hasNextPage: boolean;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  renderItem: (item: T) => ReactNode;
  renderSkeleton?: () => ReactNode;
  onLoadMore: () => void;
  title?: string;
  layout?: "grid" | "flex" | "custom";
  gridClassName?: string;
  variant?: "button" | "infinite";
  emptyMessage?: string;
}

const LAYOUT_CLASSES = {
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10",
  flex: "flex flex-col gap-4",
};

export function CursorPaginatedList<T extends { id: string | number }>({
  items,
  hasNextPage,
  isLoading = false,
  isFetchingNextPage = false,
  renderItem,
  renderSkeleton,
  onLoadMore,
  title,
  layout = "grid",
  gridClassName,
  variant = "button",
  emptyMessage = "No results found.",
}: Props<T>) {
  const containerClassName =
    gridClassName || LAYOUT_CLASSES[layout === "custom" ? "grid" : layout];
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: observe sentinel element
  useEffect(() => {
    if (variant !== "infinite" || !sentinelRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isFetchingNextPage) {
            onLoadMore();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [variant, hasNextPage, isFetchingNextPage, onLoadMore]);

  // Show skeletons while initial loading
  if (isLoading && items.length === 0 && renderSkeleton) {
    return (
      <div className="space-y-8">
        {title && <h1 className="text-3xl font-bold">{title}</h1>}
        <div className={containerClassName}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`}>{renderSkeleton()}</div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        {title && <h1 className="text-3xl font-bold">{title}</h1>}
        <div className="text-center text-muted-foreground py-12">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {title && <h1 className="text-3xl font-bold">{title}</h1>}

      <div className={containerClassName}>
        {items.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>

      {variant === "button" && hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      {variant === "infinite" && hasNextPage && (
        <div ref={sentinelRef} className="py-8 text-center">
          {isFetchingNextPage && (
            <p className="text-muted-foreground">Loading more...</p>
          )}
        </div>
      )}
    </div>
  );
}
