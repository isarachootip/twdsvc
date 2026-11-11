'use client'

import React, { useEffect, useRef } from 'react'
import type { CenterBranchItem } from '../types-v6'
import {
  getSiteCoverageKey,
  isAllOnsiteSelected,
  isSomeOnsiteSelected,
  toggleSingleOnsiteCoverage,
  toggleAllOnsiteCoverage,
  setSiteResponsibleBranch,
  type BranchCoverageMap,
} from '@/lib/vendor-branch-coverage'

export interface BranchSiteRowItem {
  id: string
  code: string
  nickname: string
  name: string
  province: string
}

interface BranchCoverageTableProps {
  sites: BranchSiteRowItem[]
  hasOnsite: boolean
  coverage: BranchCoverageMap
  branches: CenterBranchItem[]
  onCoverageChange: (nextCoverage: BranchCoverageMap) => void
}

export function BranchCoverageTable({
  sites,
  hasOnsite,
  coverage,
  branches,
  onCoverageChange,
}: BranchCoverageTableProps) {
  const headerCheckRef = useRef<HTMLInputElement>(null)
  const allSelected = hasOnsite && isAllOnsiteSelected(sites, coverage)
  const someSelected = hasOnsite && isSomeOnsiteSelected(sites, coverage)

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 border-b border-slate-200">
          <tr>
            <th className="py-2.5 px-3 font-semibold w-12 text-center">#</th>
            <th className="py-2.5 px-3 font-semibold">สาขาไทวัสดุ</th>
            <th className="py-2.5 px-3 font-semibold w-28 text-center">
              <label className="inline-flex items-center justify-center gap-1.5 cursor-pointer select-none">
                <input
                  ref={headerCheckRef}
                  type="checkbox"
                  disabled={!hasOnsite || sites.length === 0}
                  checked={allSelected}
                  onChange={() => onCoverageChange(toggleAllOnsiteCoverage(sites, coverage))}
                  title={allSelected ? 'ติ๊กเอาออกทั้งหมด' : 'ติ๊กเลือกทั้งหมด'}
                  className="w-4 h-4 accent-red-700 cursor-pointer"
                />
                <span>On-site</span>
              </label>
            </th>
            <th className="py-2.5 px-3 font-semibold">ศูนย์บริการที่รับผิดชอบ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sites.map((s, idx) => {
            const key = getSiteCoverageKey(s)
            const cov = coverage[key] || { onsite: false, respBranchIdx: 0 }
            return (
              <tr key={key} className="hover:bg-slate-50/80 transition">
                <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                <td className="py-2 px-3">
                  <span className="font-semibold text-slate-800">{s.nickname || s.name}</span>
                  <span className="text-[11px] text-slate-500 block">{s.province}</span>
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={hasOnsite && cov.onsite}
                    onChange={() => onCoverageChange(toggleSingleOnsiteCoverage(key, coverage))}
                    className="w-4 h-4 accent-red-700 cursor-pointer"
                  />
                </td>
                <td className="py-2 px-3">
                  <select
                    disabled={!hasOnsite || !cov.onsite}
                    value={cov.respBranchIdx}
                    onChange={e => onCoverageChange(setSiteResponsibleBranch(key, Number(e.target.value), coverage))}
                    className="h-8 px-2 border border-slate-300 rounded-md text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400 w-full max-w-xs"
                  >
                    {branches.map((b, bIdx) => (
                      <option key={bIdx} value={bIdx}>
                        สาขาที่ {bIdx + 1}: {b.line1 ? b.line1.slice(0, 25) : 'สาขาหลัก'}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
