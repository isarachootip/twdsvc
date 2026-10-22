'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { VendorApplicationFormV6, CenterBranchItem } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { Search, CheckSquare } from 'lucide-react'

interface BranchSiteItem {
  id: string
  code: string
  nickname: string
  name: string
  province: string
}

interface Step5BranchCoverageProps {
  form: VendorApplicationFormV6
  branches: CenterBranchItem[]
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step5BranchCoverage({ form, branches, onChange }: Step5BranchCoverageProps) {
  const [sites, setSites] = useState<BranchSiteItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vendors/public-sites')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setSites(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return sites
    const q = search.trim().toLowerCase()
    return sites.filter(s => s.nickname.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.province.toLowerCase().includes(q))
  }, [sites, search])

  const toggleOnsite = (siteKey: string) => {
    const cur = form.coverage[siteKey] || { onsite: false, respBranchIdx: 0 }
    const updated = {
      ...form.coverage,
      [siteKey]: { ...cur, onsite: !cur.onsite },
    }
    onChange({ coverage: updated })
  }

  const changeResp = (siteKey: string, branchIdx: number) => {
    const cur = form.coverage[siteKey] || { onsite: true, respBranchIdx: 0 }
    onChange({
      coverage: {
        ...form.coverage,
        [siteKey]: { ...cur, respBranchIdx: branchIdx },
      },
    })
  }

  const selectAll = () => {
    const all: Record<string, { onsite: boolean; respBranchIdx: number }> = {}
    sites.forEach(s => {
      all[s.code || s.nickname] = { onsite: true, respBranchIdx: 0 }
    })
    onChange({ coverage: all })
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={5}
        title="พื้นที่ให้บริการและการจับคู่กับสาขาไทวัสดุ"
        subtitle="เลือกรัศมีการเดินทางและกำหนดสาขาไทวัสดุที่ศูนย์บริการของท่านพร้อมรับผิดชอบดูแล"
      />

      {/* รัศมี */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
        <label className="text-xs font-bold text-slate-800">รัศมีให้บริการจากสาขาไทวัสดุ</label>
        <div className="flex flex-wrap gap-2 text-xs">
          {['10 กม.', '20 กม.', '30 กม.', '40 กม.', '50 กม.', '60 กม.'].map(r => (
            <label key={r} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="onsRadius"
                value={r}
                checked={form.onsRadius === r}
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
          <label className="text-xs font-bold text-slate-800">5.1 สาขาไทวัสดุที่ต้องการดูแล</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
            >
              <CheckSquare className="w-3.5 h-3.5 text-red-700" /> เลือก On-site ทุกสาขา
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสาขา หรือจังหวัด..."
            className="w-full h-10 px-3 pl-9 border border-slate-300 rounded-lg text-xs bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold w-12 text-center">#</th>
                <th className="py-2.5 px-3 font-semibold">สาขาไทวัสดุ</th>
                <th className="py-2.5 px-3 font-semibold w-24 text-center">On-site</th>
                <th className="py-2.5 px-3 font-semibold">ศูนย์บริการที่รับผิดชอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s, idx) => {
                const key = s.code || s.nickname
                const cov = form.coverage[key] || { onsite: false, respBranchIdx: 0 }
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
                        checked={cov.onsite}
                        onChange={() => toggleOnsite(key)}
                        className="w-4 h-4 accent-red-700 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        disabled={!cov.onsite}
                        value={cov.respBranchIdx}
                        onChange={e => changeResp(key, Number(e.target.value))}
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
      </div>
    </div>
  )
}
