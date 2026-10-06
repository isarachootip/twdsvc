'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { RouteCoverageUI, BranchItemUI, SvcBranchSite } from '../types'
import { BranchRouteItem } from './BranchRouteItem'
import { Map, Search, CheckSquare, Settings2, RotateCcw } from 'lucide-react'

interface Step3CoverageProps {
  coverage: Record<string, RouteCoverageUI>
  vendorBranches: BranchItemUI[]
  onUpdateCoverage: (coverage: Record<string, RouteCoverageUI>) => void
}

const REGIONS = ['ทั้งหมด', 'กลาง', 'เหนือ', 'อีสาน', 'ตะวันออก', 'ใต้']

export function Step3Coverage({ coverage, vendorBranches, onUpdateCoverage }: Step3CoverageProps) {
  const [sites, setSites] = useState<SvcBranchSite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('ทั้งหมด')

  useEffect(() => {
    fetch('/api/vendors/public-sites')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSites(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.nickname.toLowerCase().includes(search.toLowerCase()) ||
        s.code.includes(search)
      const matchRegion = selectedRegion === 'ทั้งหมด' || s.region === selectedRegion
      return matchSearch && matchRegion
    })
  }, [sites, search, selectedRegion])

  const toggleSite = (code: string) => {
    const next = { ...coverage }
    if (next[code]) {
      delete next[code]
    } else {
      next[code] = {
        transport: 'pickup',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        times: ['morning', 'afternoon'],
        frequency: 'สัปดาห์ละ 2 ครั้ง',
        note: '',
        transitDays: '2-3',
        vendorDeliveryAddressId: vendorBranches[0]?.id || null,
      }
    }
    onUpdateCoverage(next)
  }

  const selectAllFiltered = () => {
    const next = { ...coverage }
    filteredSites.forEach(s => {
      const key = s.nickname || s.code
      if (!next[key]) {
        next[key] = {
          transport: 'pickup',
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          times: ['morning', 'afternoon'],
          frequency: 'สัปดาห์ละ 2 ครั้ง',
          note: '',
          transitDays: '2-3',
          vendorDeliveryAddressId: vendorBranches[0]?.id || null,
        }
      }
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
        {/* Left: Branch Directory Filter */}
        <div className="lg:col-span-6 space-y-3">
          <div className="p-4 rounded-xl border bg-white space-y-3" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                className="inp pl-9 text-xs"
                placeholder="ค้นหาชื่อสาขา หรือ รหัส เช่น เชียงใหม่, SSM..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {REGIONS.map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    selectedRegion === r ? 'bg-red-700 text-white border-red-700 font-semibold' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
              <span>แสดง {filteredSites.length} สาขา</span>
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-red-700 font-semibold hover:underline flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" /> เลือกทั้งหมดที่กรอง
              </button>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-1.5 p-1">
            {filteredSites.map(s => {
              const key = s.nickname || s.code
              const isSelected = Boolean(coverage[key])
              return (
                <div
                  key={s.id}
                  onClick={() => toggleSite(key)}
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
              Object.entries(coverage).map(([siteKey, route]) => {
                const siteObj = sites.find(s => (s.nickname || s.code) === siteKey) || {
                  id: siteKey,
                  code: siteKey,
                  nickname: siteKey,
                  name: siteKey,
                  province: '',
                  region: '',
                }
                return (
                  <BranchRouteItem
                    key={siteKey}
                    site={siteObj}
                    route={route}
                    vendorBranches={vendorBranches}
                    onUpdateRoute={patch => onUpdateCoverage({ ...coverage, [siteKey]: { ...route, ...patch } })}
                    onRemoveRoute={() => toggleSite(siteKey)}
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
