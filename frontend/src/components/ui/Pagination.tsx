'use client';

import React from 'react';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('ellipsis');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startItem = totalItems !== undefined && itemsPerPage !== undefined 
    ? Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)
    : null;
  const endItem = totalItems !== undefined && itemsPerPage !== undefined
    ? Math.min(totalItems, currentPage * itemsPerPage)
    : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-150 font-sans">
      {startItem !== null && endItem !== null && totalItems !== undefined ? (
        <p className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-700">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-700">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-700">{totalItems}</span> items
        </p>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="!py-1"
        >
          Previous
        </Button>

        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400 text-xs select-none">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 text-xs font-bold rounded border transition-colors select-none ${
                currentPage === pageNum
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="!py-1"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
