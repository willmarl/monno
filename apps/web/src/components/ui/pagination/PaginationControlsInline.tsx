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

interface PaginationControlsInlineProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControlsInline({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsInlineProps) {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleGoToPage = () => {
    const pageNum = parseInt(inputPage, 10);
    if (pageNum > 0 && pageNum <= totalPages) {
      handlePageChange(pageNum);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGoToPage();
    }
  };

  // Build page numbers array
  const pageNumbers = (() => {
    const nums: (number | string)[] = [];

    // Small datasets → no ellipsis
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
      return nums;
    }

    // Large datasets → use ellipses
    if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];
    if (currentPage >= totalPages - 2)
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
      currentPage - 1,
      currentPage,
      currentPage + 1,
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
            onClick={() => handlePageChange(currentPage - 1)}
            className={
              currentPage === 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>

        {/* PAGE NUMBERS */}
        {pageNumbers.map((num, idx) =>
          num === "..." ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={`page-${num}`}>
              <PaginationLink
                onClick={() => handlePageChange(num as number)}
                isActive={num === currentPage}
                className="cursor-pointer"
              >
                {num}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        {/* GO TO PAGE INPUT */}
        <PaginationItem>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="1"
              max={totalPages}
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-12 h-9"
            />
            <Button onClick={handleGoToPage} size="sm">
              Go
            </Button>
          </div>
        </PaginationItem>

        {/* NEXT BUTTON */}
        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(currentPage + 1)}
            className={
              currentPage === totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
