"use client";

import { ReactNode } from "react";
import { PaginationControlsInline } from "./PaginationControlsInline";

interface Props<T> {
  page: number;
  limit: number;
  items: T[];
  totalItems: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  renderItem: (item: T) => ReactNode;
  renderSkeleton?: () => ReactNode;
  title?: string;
  layout?: "grid" | "flex" | "custom";
  gridClassName?: string;
  emptyMessage?: string;
}

const LAYOUT_CLASSES = {
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-10",
  flex: "flex flex-col gap-4",
};

export function PaginatedListInline<T extends { id: string | number }>({
  page,
  limit,
  items,
  totalItems,
  isLoading = false,
  onPageChange,
  renderItem,
  renderSkeleton,
  title,
  layout = "grid",
  gridClassName,
  emptyMessage = "No results found.",
}: Props<T>) {
  const containerClassName =
    gridClassName || LAYOUT_CLASSES[layout === "custom" ? "grid" : layout];
  const totalPages = Math.ceil(totalItems / limit);

  // Show skeletons while loading
  if (isLoading && items.length === 0 && renderSkeleton) {
    return (
      <div className="space-y-6 md:space-y-8">
        {title && (
          <h1 className="text-xl md:text-3xl font-bold break-words">{title}</h1>
        )}
        <div className={containerClassName}>
          {Array.from({ length: limit }).map((_, i) => (
            <div key={`skeleton-${i}`}>{renderSkeleton()}</div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6 md:space-y-8">
        {title && (
          <h1 className="text-xl md:text-3xl font-bold break-words">{title}</h1>
        )}
        <div className="text-center text-muted-foreground py-12">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {title && (
        <h1 className="text-xl md:text-3xl font-bold break-words">{title}</h1>
      )}

      <div className={containerClassName}>
        {items.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>

      <PaginationControlsInline
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
