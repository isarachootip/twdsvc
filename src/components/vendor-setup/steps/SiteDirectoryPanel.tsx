'use client'

import { Search, CheckSquare } from 'lucide-react'
import type { RouteCoverageUI, SvcBranchSite } from '../types'

export const REGIONS = ['ทั้งหมด', 'กลาง', 'เหนือ', 'อีสาน', 'ตะวันออก', 'ใต้']

/** Coverage key used for an SVC site (nickname preferred, falls back to code). */
export const siteKey = (s: SvcBranchSite) => s.nickname || s.code

interface SiteDirectoryPanelProps {
  sites: SvcBranchSite[]
  coverage: Record<string, RouteCoverageUI>
  search: string
  region: string
  onSearchChange: (v: string) => void
  onRegionChange: (v: string) => void
  onToggle: (key: string) => void
  onSelectAll: () => void
}

/** Left panel of Step 3: searchable / region-filtered SVC branch directory. */
export function SiteDirectoryPanel({
  sites, coverage, search, region, onSearchChange, onRegionChange, onToggle, onSelectAll,
}: SiteDirectoryPanelProps) {
  return (
    <div className="lg:col-span-6 space-y-3">
      <div className="p-4 rounded-xl border bg-white space-y-3" style={{ borderColor: 'var(--border)' }}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            className="inp pl-9 text-xs"
            placeholder="ค้นหาชื่อสาขา หรือ รหัส เช่น เชียงใหม่, SSM..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {REGIONS.map(r => (
            <button
              type="button"
              key={r}
              onClick={() => onRegionChange(r)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                region === r ? 'bg-red-700 text-white border-red-700 font-semibold' : 'bg-slate-50 text-slate-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
          <span>แสดง {sites.length} สาขา</span>
          <button
            type="button"
            onClick={onSelectAll}
            className="text-red-700 font-semibold hover:underline flex items-center gap-1"
          >
            <CheckSquare className="w-3.5 h-3.5" /> เลือกทั้งหมดที่กรอง
          </button>
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto space-y-1.5 p-1">
        {sites.map(s => {
          const key = siteKey(s)
          const isSelected = Boolean(coverage[key])
          return (
            <div
              key={s.id}
              onClick={() => onToggle(key)}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer select-none ${
                isSelected ? 'bg-red-50 border-red-500 font-medium' : 'bg-white hover:bg-slate-50'
              }`}
              style={{ borderColor: isSelected ? 'var(--red)' : 'var(--border)' }}
            >
              <div>
                <span className="font-semibold">{s.name}</span>
                <span className="text-slate-500 ml-2">({key}) • {s.province}</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {isSelected ? 'เลือกแล้ว' : '+ เลือก'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
