'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface ProductPaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function ProductPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: ProductPaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border rounded-xl px-4 py-3 mt-4 text-sm shadow-xs" style={{ borderColor: 'var(--border)' }}>
      {/* Range summary */}
      <div className="text-gray-500 text-xs sm:text-sm">
        แสดง <span className="font-semibold text-gray-900">{from.toLocaleString()}</span> -{' '}
        <span className="font-semibold text-gray-900">{to.toLocaleString()}</span> จากทั้งหมด{' '}
        <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> รายการ
      </div>

      <div className="flex items-center gap-3">
        {/* Page size limit */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>แสดงหน้าละ:</span>
          <select
            value={limit}
            onChange={e => onLimitChange(Number(e.target.value))}
            className="border rounded-md px-2 py-1 bg-white text-gray-700 text-xs focus:outline-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="หน้าแรก"
            aria-label="หน้าแรก"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="หน้าก่อนหน้า"
            aria-label="หน้าก่อนหน้า"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-xs px-2.5 py-1 text-gray-700 font-medium">
            หน้า {page.toLocaleString()} / {Math.max(1, totalPages).toLocaleString()}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="หน้าถัดไป"
            aria-label="หน้าถัดไป"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="หน้าสุดท้าย"
            aria-label="หน้าสุดท้าย"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
