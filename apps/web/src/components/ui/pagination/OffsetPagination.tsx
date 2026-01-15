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
  queryParams?: Record<string, string | undefined>;
}

export function OffsetPagination({
  url,
  page,
  limit,
  totalItems,
  queryParams,
}: Props) {
  const totalPages = Math.ceil(totalItems / limit);

  // Clamp page to valid range (1 to totalPages)
  const validPage = Math.min(Math.max(1, page), totalPages);
  const [inputPage, setInputPage] = useState(validPage.toString());

  // Sync inputPage when page prop changes (from URL)
  useEffect(() => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setInputPage(clamped.toString());
  }, [page, totalPages]);

  // Build the href with page parameter
  const buildHref = (pageNum: number) => {
    const qs = new URLSearchParams();
    qs.set("page", pageNum.toString());
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) qs.set(key, value);
      });
    }
    return `/${url}?${qs.toString()}`;
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
    if (validPage <= 3) return [1, 2, 3, 4, "...", totalPages];
    if (validPage >= totalPages - 2)
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];

    return [
      1,
      "...",
      validPage - 1,
      validPage,
      validPage + 1,
      "...",
      totalPages,
    ];
  })();

  return (
    <Pagination>
      <PaginationContent>
        {/* PREV BUTTON */}
        <PaginationItem>
          <PaginationPrevious
            href={validPage > 1 ? buildHref(validPage - 1) : "#"}
            onClick={(e) => {
              if (validPage === 1) e.preventDefault();
            }}
            className={validPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                isActive={num === validPage}
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
            href={validPage < totalPages ? buildHref(validPage + 1) : "#"}
            onClick={(e) => {
              if (validPage === totalPages) e.preventDefault();
            }}
            className={
              validPage === totalPages ? "pointer-events-none opacity-50" : ""
            }
            size="default"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
