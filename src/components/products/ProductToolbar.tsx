'use client'

import { Search, RotateCcw, X, Layers, Tag } from 'lucide-react'
import type { ProductFilterState, ProductMetaResponse } from './types'

interface ProductToolbarProps {
  filters: ProductFilterState
  searchInput: string
  meta: ProductMetaResponse
  total: number
  onSearchChange: (val: string) => void
  onBrandChange: (brand: string) => void
  onDeptChange: (dept: string) => void
  onStatusChange: (status: ProductFilterState['status']) => void
  onReset: () => void
}

export function ProductToolbar({
  filters,
  searchInput,
  meta,
  total,
  onSearchChange,
  onBrandChange,
  onDeptChange,
  onStatusChange,
  onReset,
}: ProductToolbarProps) {
  const hasActiveFilters = Boolean(
    filters.search || filters.brand || filters.dept || filters.status !== 'all'
  )

  return (
    <div className="bg-white border rounded-xl p-4 mb-4 shadow-xs flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="ค้นหา SKU, บาร์โค้ด, IBC, SBC, ชื่อสินค้า, รุ่น..."
            value={searchInput}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            style={{ borderColor: 'var(--border)' }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
              aria-label="ล้างคำค้นหา"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Brand Dropdown */}
        <div className="flex items-center gap-1.5 min-w-[190px]">
          <Tag size={15} className="text-gray-400 shrink-0" />
          <select
            value={filters.brand}
            onChange={e => onBrandChange(e.target.value)}
            className="w-full py-2 px-2.5 text-sm border rounded-lg bg-white text-gray-700 focus:outline-hidden focus:border-red-500"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="">ทุก Brand ({meta.brands.length})</option>
            {meta.brands.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Category / Dept Dropdown */}
        <div className="flex items-center gap-1.5 min-w-[210px]">
          <Layers size={15} className="text-gray-400 shrink-0" />
          <select
            value={filters.dept}
            onChange={e => onDeptChange(e.target.value)}
            className="w-full py-2 px-2.5 text-sm border rounded-lg bg-white text-gray-700 focus:outline-hidden focus:border-red-500"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="">ทุกหมวดหมู่ ({meta.departments.length})</option>
            {meta.departments.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg border text-xs font-medium shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filters.status === 'all' ? 'bg-white shadow-xs text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('active')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filters.status === 'active' ? 'bg-green-600 text-white font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('inactive')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filters.status === 'inactive' ? 'bg-gray-700 text-white font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            In-active
          </button>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 border rounded-lg bg-gray-50 hover:bg-red-50 transition-colors shrink-0"
            style={{ borderColor: 'var(--border)' }}
            title="ล้างตัวกรองทั้งหมด"
          >
            <RotateCcw size={14} />
            <span>ล้างตัวกรอง</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <span>พบสินค้าทั้งหมด</span>
          <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full border text-xs">
            {total.toLocaleString()} SKU
          </span>
        </div>
        {hasActiveFilters && (
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
            กำลังกรองข้อมูล
          </span>
        )}
      </div>
    </div>
  )
}
