'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { RouteCoverageUI, BranchItemUI, SvcBranchSite } from '../types'
import { BranchRouteItem } from './BranchRouteItem'
import { SiteDirectoryPanel, siteKey } from './SiteDirectoryPanel'
import { Settings2, RotateCcw } from 'lucide-react'

interface Step3CoverageProps {
  coverage: Record<string, RouteCoverageUI>
  vendorBranches: BranchItemUI[]
  onUpdateCoverage: (coverage: Record<string, RouteCoverageUI>) => void
}

const defaultRoute = (vendorBranches: BranchItemUI[]): RouteCoverageUI => ({
  transport: 'pickup',
  days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  times: ['morning', 'afternoon'],
  frequency: 'สัปดาห์ละ 2 ครั้ง',
  note: '',
  transitDays: '2-3',
  vendorDeliveryAddressId: vendorBranches[0]?.id || null,
})

export function Step3Coverage({ coverage, vendorBranches, onUpdateCoverage }: Step3CoverageProps) {
  const [sites, setSites] = useState<SvcBranchSite[]>([])
  const [search, setSearch] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('ทั้งหมด')

  useEffect(() => {
    fetch('/api/vendors/public-sites')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSites(data)
      })
      .catch(() => {})
  }, [])

  const filteredSites = useMemo(() => {
    const q = search.toLowerCase()
    return sites.filter(s => {
      const matchSearch = !search || s.name.toLowerCase().includes(q) || s.nickname.toLowerCase().includes(q) || s.code.includes(search)
      const matchRegion = selectedRegion === 'ทั้งหมด' || s.region === selectedRegion
      return matchSearch && matchRegion
    })
  }, [sites, search, selectedRegion])

  const toggleSite = (code: string) => {
    const next = { ...coverage }
    if (next[code]) delete next[code]
    else next[code] = defaultRoute(vendorBranches)
    onUpdateCoverage(next)
  }

  const selectAllFiltered = () => {
    const next = { ...coverage }
    filteredSites.forEach(s => {
      const key = siteKey(s)
      if (!next[key]) next[key] = defaultRoute(vendorBranches)
    })
    onUpdateCoverage(next)
  }

  const applyBulk3plAddress = (vendorAddressId: string) => {
    const next = { ...coverage }
    Object.keys(next).forEach(k => {
      next[k] = { ...next[k], transport: 'tpl', vendorDeliveryAddressId: vendorAddressId }
    })
    onUpdateCoverage(next)
  }

  const selectedCount = Object.keys(coverage).length

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl text-white flex items-center justify-between" style={{ backgroundColor: 'var(--navy)' }}>
        <div>
          <div className="text-xs opacity-75">เลือกพื้นที่บริการสาขา SVC (ทั่วประเทศ)</div>
          <div className="text-lg font-bold">เลือกแล้ว {selectedCount}/{sites.length || 95} สาขา</div>
        </div>
        <div className="flex gap-2">
          {vendorBranches.length > 0 && (
            <button
              type="button"
              onClick={() => applyBulk3plAddress(vendorBranches[0].id)}
              className="btn btn-secondary text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white border-none"
            >
              <Settings2 className="w-3.5 h-3.5" /> ตั้งค่า 3PL ทั้งหมด
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <SiteDirectoryPanel
          sites={filteredSites}
          coverage={coverage}
          search={search}
          region={selectedRegion}
          onSearchChange={setSearch}
          onRegionChange={setSelectedRegion}
          onToggle={toggleSite}
          onSelectAll={selectAllFiltered}
        />

        {/* Right: Selected Routes Configuration */}
        <div className="lg:col-span-6 space-y-3">
          <div className="font-semibold text-sm flex items-center justify-between" style={{ color: 'var(--text)' }}>
            <span>การตั้งค่าขนส่ง ({selectedCount} สาขา)</span>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => onUpdateCoverage({})}
                className="text-xs text-red-500 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> ล้างทั้งหมด
              </button>
            )}
          </div>
          <div className="max-h-[480px] overflow-y-auto space-y-2.5 pr-1">
            {selectedCount === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-xl bg-white text-xs text-slate-400">
                ยังไม่ได้เลือกสาขา SVC<br />คลิกเลือกสาขาจากรายการฝั่งซ้ายเพื่อกำหนดวิธีการขนส่ง
              </div>
            ) : (
              Object.entries(coverage).map(([key, route]) => {
                const siteObj = sites.find(s => siteKey(s) === key) || {
                  id: key, code: key, nickname: key, name: key, province: '', region: '',
                }
                return (
                  <BranchRouteItem
                    key={key}
                    site={siteObj}
                    route={route}
                    vendorBranches={vendorBranches}
                    onUpdateRoute={patch => onUpdateCoverage({ ...coverage, [key]: { ...route, ...patch } })}
                    onRemoveRoute={() => toggleSite(key)}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
