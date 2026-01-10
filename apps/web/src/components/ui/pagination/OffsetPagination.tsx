"use client";

import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  page: number;
  limit: number;
  totalItems: number;
}

export function OffsetPagination({ url, page, limit, totalItems }: Props) {
  const [inputPage, setInputPage] = useState(page.toString());

  // Sync inputPage when page prop changes (from URL)
  useEffect(() => {
    setInputPage(page.toString());
  }, [page]);
  const totalPages = Math.ceil(totalItems / limit);

  // Build the href with page parameter
  const buildHref = (pageNum: number) => {
    const separator = url.includes("?") ? "&" : "?";
    return `/${url}${separator}page=${pageNum}`;
  };

  const handleGoToPage = () => {
    const pageNum = parseInt(inputPage, 10);
    if (pageNum > 0 && pageNum <= totalPages) {
      window.location.href = buildHref(pageNum);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGoToPage();
    }
  };

  // Build array like: [1, 2, 3, 4]
  const pageNumbers = (() => {
    const nums: number[] = [];

    // Small datasets → no ellipsis
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
      return nums;
    }

    // Large datasets → use ellipses
    if (page <= 3) return [1, 2, 3, 4, "...", totalPages];
    if (page >= totalPages - 2)
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];

    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  })();

  return (
    <Pagination>
      <PaginationContent>
        {/* PREV BUTTON */}
        <PaginationItem>
          <PaginationPrevious
            href={page > 1 ? buildHref(page - 1) : "#"}
            onClick={(e) => {
              if (page === 1) e.preventDefault();
            }}
            className={page === 1 ? "pointer-events-none opacity-50" : ""}
            size="default"
          />
        </PaginationItem>

        {/* PAGE NUMBERS */}
        {pageNumbers.map((num, idx) =>
          num === "..." ? (
            <PaginationItem key={idx}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={num}>
              <PaginationLink
                href={buildHref(num as number)}
                isActive={num === page}
                size="icon"
              >
                {num}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        {/* GO TO PAGE INPUT */}
        <PaginationItem>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max={totalPages}
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Go to"
              className="w-16"
            />
            <Button onClick={handleGoToPage} size="sm">
              Go
            </Button>
          </div>
        </PaginationItem>

        {/* NEXT BUTTON */}
        <PaginationItem>
          <PaginationNext
            href={page < totalPages ? buildHref(page + 1) : "#"}
            onClick={(e) => {
              if (page === totalPages) e.preventDefault();
            }}
            className={
              page === totalPages ? "pointer-events-none opacity-50" : ""
            }
            size="default"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
