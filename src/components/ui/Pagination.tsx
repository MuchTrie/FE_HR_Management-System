import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  total?: number
  perPage?: number
}

export default function Pagination({ page, totalPages, onPageChange, total, perPage }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p =>
    p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )

  const renderPage = (p: number, idx: number, arr: number[]) => {
    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
    return (
      <React.Fragment key={p}>
        {showEllipsis && (
          <span className="px-2 py-1 text-gray-400 text-sm">…</span>
        )}
        <button
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
            p === page
              ? 'bg-brand-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {p}
        </button>
      </React.Fragment>
    )
  }

  return (
    <div className="flex items-center justify-between mt-4">
      {total !== undefined && perPage !== undefined ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
        </p>
      ) : <span />}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map(renderPage)}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
import React from 'react'
