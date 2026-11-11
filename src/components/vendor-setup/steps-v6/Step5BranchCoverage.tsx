'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { VendorApplicationFormV6, CenterBranchItem } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { OnsiteLockNotice } from '../common/OnsiteLockNotice'
import { Search, CheckSquare, Square } from 'lucide-react'
import {
  countOnsiteSelected,
  isAllOnsiteSelected,
  toggleAllOnsiteCoverage,
} from '@/lib/vendor-branch-coverage'
import { BranchCoverageTable, type BranchSiteRowItem } from './BranchCoverageTable'

interface Step5BranchCoverageProps {
  form: VendorApplicationFormV6
  branches: CenterBranchItem[]
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step5BranchCoverage({ form, branches, onChange }: Step5BranchCoverageProps) {
  const hasOnsite = form.onsProducts.length > 0
  const [sites, setSites] = useState<BranchSiteRowItem[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/vendors/public-sites')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setSites(data)
      })
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return sites
    const q = search.trim().toLowerCase()
    return sites.filter(
      s => s.nickname.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.province.toLowerCase().includes(q),
    )
  }, [sites, search])

  const selectedCount = useMemo(() => countOnsiteSelected(sites, form.coverage), [sites, form.coverage])
  const allSitesSelected = hasOnsite && isAllOnsiteSelected(sites, form.coverage)

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={5}
        title="พื้นที่ให้บริการและการจับคู่กับสาขาไทวัสดุ"
        subtitle="เลือกรัศมีการเดินทางและกำหนดสาขาไทวัสดุที่ศูนย์บริการของท่านพร้อมรับผิดชอบดูแล"
      />

      {!hasOnsite && (
        <div className="px-1">
          <OnsiteLockNotice />
        </div>
      )}

      <fieldset disabled={!hasOnsite} className={!hasOnsite ? 'opacity-50 pointer-events-none space-y-5' : 'space-y-5'}>
        {/* รัศมี */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <label className="text-xs font-bold text-slate-800 block">รัศมีให้บริการจากสาขาไทวัสดุ</label>
          <div className="flex flex-wrap gap-2 text-xs">
            {['10 กม.', '20 กม.', '30 กม.', '40 กม.', '50 กม.', '60 กม.'].map(r => (
              <label key={r} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="onsRadius"
                  value={r}
                  checked={hasOnsite && form.onsRadius === r}
                  onChange={e => onChange({ onsRadius: e.target.value })}
                  className="accent-red-700"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ตารางจับคู่สาขา */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs font-bold text-slate-800">
              5.1 สาขาไทวัสดุที่ต้องการดูแล
              {sites.length > 0 && (
                <span className="ml-2 font-normal text-slate-500">
                  (เลือกแล้ว {hasOnsite ? selectedCount : 0}/{sites.length} สาขา)
                </span>
              )}
            </label>
            <button
              type="button"
              disabled={!hasOnsite || sites.length === 0}
              onClick={() => onChange({ coverage: toggleAllOnsiteCoverage(sites, form.coverage) })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-lg font-semibold transition cursor-pointer disabled:opacity-50 ${
                allSitesSelected
                  ? 'border-rose-300 text-rose-700 bg-white hover:bg-rose-50'
                  : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
              }`}
            >
              {allSitesSelected ? (
                <>
                  <Square className="w-3.5 h-3.5 text-rose-600" /> ยกเลิกเลือก On-site ทุกสาขา
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-red-700" /> เลือก On-site ทุกสาขา
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสาขา หรือจังหวัด..."
              className="w-full h-10 px-3 pl-9 border border-slate-300 rounded-lg text-xs bg-white disabled:bg-slate-100"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <BranchCoverageTable
            sites={filtered}
            hasOnsite={hasOnsite}
            coverage={form.coverage}
            branches={branches}
            onCoverageChange={nextCoverage => onChange({ coverage: nextCoverage })}
          />
        </div>
      </fieldset>
    </div>
  )
}
