'use client'

import React from 'react'
import { Search, Plus, Wand2, Filter, X } from 'lucide-react'
import { VendorFilterState } from './vendor-types'

interface VendorToolbarProps {
  filter: VendorFilterState
  onFilterChange: (patch: Partial<VendorFilterState>) => void
  totalCount: number
  filteredCount: number
  onAddNew: () => void
  onOpenWizard: () => void
}

export function VendorToolbar({
  filter,
  onFilterChange,
  totalCount,
  filteredCount,
  onAddNew,
  onOpenWizard,
}: VendorToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs mb-3">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหารหัส หรือชื่อคู่ค้า..."
            value={filter.search}
            onChange={e => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filter.authorized}
            onChange={e =>
              onFilterChange({
                authorized: e.target.value as VendorFilterState['authorized'],
              })
            }
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="ALL">สถานะศูนย์: ทั้งหมด</option>
            <option value="AUTH">ศูนย์แบรนด์ (Authorized)</option>
            <option value="GENERAL">คู่ค้าทั่วไป</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-400 ml-1">
          (แสดง {filteredCount} จาก {totalCount} รายการ)
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenWizard}
          className="btn btn-secondary text-xs flex items-center gap-1.5"
        >
          <Wand2 className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">ตัวช่วยตั้งค่า</span> (Wizard)
        </button>
        <button
          type="button"
          onClick={onAddNew}
          className="btn btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มคู่ค้าใหม่</span>
        </button>
      </div>
    </div>
  )
}
