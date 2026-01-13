"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageInfo } from "@/types/pagination";

interface UnifiedPaginationProps {
  pageInfo: PageInfo;
  currentPage: number;
}

export function UnifiedPagination({
  pageInfo,
  currentPage,
}: UnifiedPaginationProps) {
  const router = useRouter();
  const params = useSearchParams();

  const { hasNext, hasPrev, nextOffset, prevOffset, limit, totalItems } =
    pageInfo;
  const totalPages = Math.ceil((totalItems || 0) / limit);

  function setOffset(newOffset: number) {
    const qs = new URLSearchParams(params.toString());
    qs.set("offset", newOffset.toString());
    qs.set("page", (newOffset / limit + 1).toString());
    // Update URL with all params preserved (q, sort, searchIn, etc)
    router.push(`/?${qs.toString()}`);
  }

  function goToPage(page: number) {
    const newOffset = (page - 1) * limit;
    setOffset(newOffset);
  }

  // Generate page numbers to display (show max 5 pages)
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return { pages, startPage, endPage };
  };

  const { pages: pageNumbers, startPage, endPage } = getPageNumbers();

  return (
    <div className="flex flex-col gap-6">
      {/* Page number buttons */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* Previous button */}
        <Button
          onClick={() => setOffset(prevOffset)}
          disabled={!hasPrev}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {/* Show first page if not visible */}
        {startPage > 1 && (
          <>
            <Button
              onClick={() => goToPage(1)}
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
            >
              1
            </Button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}

        {/* Page numbers */}
        {pageNumbers.map((page) => (
          <Button
            key={page}
            onClick={() => goToPage(page)}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
          >
            {page}
          </Button>
        ))}

        {/* Show last page if not visible */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="text-gray-400">...</span>
            )}
            <Button
              onClick={() => goToPage(totalPages)}
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Next button */}
        <Button
          onClick={() => setOffset(nextOffset)}
          disabled={!hasNext}
          variant="outline"
          size="sm"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Go to page input */}
      <div className="flex items-center justify-center gap-2">
        <label htmlFor="goto-page" className="text-sm text-gray-600">
          Go to page:
        </label>
        <input
          id="goto-page"
          type="number"
          min="1"
          max={totalPages}
          defaultValue={currentPage}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const page = Math.max(
                1,
                Math.min(totalPages, parseInt(e.currentTarget.value) || 1)
              );
              goToPage(page);
            }
          }}
          className="w-16 px-2 py-1 border rounded text-sm"
        />
        <span className="text-sm text-gray-600">of {totalPages}</span>
      </div>
    </div>
  );
}
