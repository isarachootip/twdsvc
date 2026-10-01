'use client'

import React from 'react'
import { Search, Plus, Filter, X } from 'lucide-react'
import { BranchFilterState, REGION_OPTIONS } from './branch-types'

interface BranchToolbarProps {
  filter: BranchFilterState
  onFilterChange: (next: BranchFilterState) => void
  onAddNew: () => void
}

export function BranchToolbar({ filter, onFilterChange, onAddNew }: BranchToolbarProps) {
  const hasActiveFilters =
    filter.search.trim() !== '' ||
    filter.type !== 'ALL' ||
    filter.status !== 'ALL' ||
    filter.region !== 'ทั้งหมด'

  const clearFilters = () => {
    onFilterChange({
      search: '',
      type: 'ALL',
      status: 'ALL',
      region: 'ทั้งหมด',
    })
  }

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4 space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            placeholder="ค้นหารหัสสาขา, ชื่อสาขา, ผู้จัดการเขต, จังหวัด, เบอร์โทร..."
            value={filter.search}
            onChange={e => onFilterChange({ ...filter, search: e.target.value })}
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ ...filter, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Add Branch Button */}
        <button
          onClick={onAddNew}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มสาขา / คลังใหม่</span>
        </button>
      </div>

      {/* Filter Pills & Region Select */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 text-slate-500 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>ตัวกรอง:</span>
        </div>

        {/* Type Filter */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
          {(['ALL', 'BRANCH', 'DC'] as const).map(t => (
            <button
              key={t}
              onClick={() => onFilterChange({ ...filter, type: t })}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter.type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t === 'ALL' ? 'ทั้งหมด' : t === 'BRANCH' ? 'เฉพาะสาขา' : 'เฉพาะคลัง DC'}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(s => (
            <button
              key={s}
              onClick={() => onFilterChange({ ...filter, status: s })}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter.status === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {s === 'ALL' ? 'ทุกสถานะ' : s === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
            </button>
          ))}
        </div>

        {/* Region Dropdown */}
        <select
          value={filter.region}
          onChange={e => onFilterChange({ ...filter, region: e.target.value })}
          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {REGION_OPTIONS.map(r => (
            <option key={r} value={r}>
              {r === 'ทั้งหมด' ? 'ทุกภูมิภาค' : r}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-red-600 hover:text-red-700 underline ml-auto"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    </div>
  )
}
