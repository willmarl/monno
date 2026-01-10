"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  queryParam?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  basePath,
  queryParam = "page",
}: PaginationControlsProps) {
  const router = useRouter();
  const params = useSearchParams();

  const handlePageChange = (page: number) => {
    const qs = new URLSearchParams(params.toString());
    qs.set(queryParam, page.toString());
    router.push(`${basePath}?${qs.toString()}`);
  };

  const handlePrevious = () => {
    if (currentPage > 1) handlePageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) handlePageChange(currentPage + 1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col gap-4">
      {/* Page number buttons */}
      <div className="flex items-center justify-center gap-2">
        {/* Previous button */}
        <Button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Page numbers */}
        {pageNumbers[0] > 1 && (
          <>
            <Button
              onClick={() => handlePageChange(1)}
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
            >
              1
            </Button>
            {pageNumbers[0] > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pageNumbers.map((page) => (
          <Button
            key={page}
            onClick={() => handlePageChange(page)}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
          >
            {page}
          </Button>
        ))}

        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="text-gray-500">...</span>
            )}
            <Button
              onClick={() => handlePageChange(totalPages)}
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Next button */}
        <Button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          Next
          <ChevronRight className="h-4 w-4" />
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
              handlePageChange(page);
            }
          }}
          className="w-16 px-2 py-1 border rounded text-sm"
        />
        <span className="text-sm text-gray-600">of {totalPages}</span>
      </div>
    </div>
  );
}
