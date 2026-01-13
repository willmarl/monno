"use client";

import { useEffect, useRef, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props<T> {
  items: T[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore: () => void;
  renderItem: (item: T) => ReactNode;
  title?: string;
  layout?: "grid" | "flex" | "custom";
  gridClassName?: string;
}

const LAYOUT_CLASSES = {
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10",
  flex: "flex flex-col gap-4",
};

export function CursorInfiniteList<T extends { id: string | number }>({
  items,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  renderItem,
  title,
  layout = "grid",
  gridClassName,
}: Props<T>) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const containerClassName =
    gridClassName || LAYOUT_CLASSES[layout === "custom" ? "grid" : layout];

  // Infinite scroll observer
  useEffect(() => {
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasNextPage, onLoadMore]);

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-8">
      {title && <h1 className="text-3xl font-bold">{title}</h1>}

      <div className={containerClassName}>
        {items.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasNextPage && <div ref={sentinelRef} className="h-10" />}

      {!hasNextPage && items.length > 0 && (
        <div className="text-center text-sm text-gray-600 py-10">
          You've reached the end.
        </div>
      )}
    </div>
  );
}
