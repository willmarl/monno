"use client";

import { ReactNode } from "react";
import { OffsetPagination } from "./OffsetPagination";

interface Props<T> {
  url: string;
  page: number;
  limit: number;
  items: T[];
  totalItems: number;
  isLoading?: boolean;
  renderItem: (item: T) => ReactNode;
  title?: string;
  layout?: "grid" | "flex" | "custom";
  gridClassName?: string;
}

const LAYOUT_CLASSES = {
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10",
  flex: "flex flex-col gap-4",
};

export function PaginatedList<T extends { id: string | number }>({
  url,
  page,
  limit,
  items,
  totalItems,
  isLoading = false,
  renderItem,
  title,
  layout = "grid",
  gridClassName,
}: Props<T>) {
  if (isLoading) return <p>Loading...</p>;

  const containerClassName =
    gridClassName || LAYOUT_CLASSES[layout === "custom" ? "grid" : layout];

  return (
    <div className="space-y-8">
      {title && <h1 className="text-3xl font-bold">{title}</h1>}

      <div className={containerClassName}>
        {items.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>

      <OffsetPagination
        url={url}
        page={page}
        limit={limit}
        totalItems={totalItems}
      />
    </div>
  );
}
