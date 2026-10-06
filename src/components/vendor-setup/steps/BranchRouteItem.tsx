'use client'

import React from 'react'
import type { RouteCoverageUI, BranchItemUI, SvcBranchSite } from '../types'
import { Truck, Warehouse, PackageCheck, Clock } from 'lucide-react'

interface BranchRouteItemProps {
  site: SvcBranchSite
  route: RouteCoverageUI
  vendorBranches: BranchItemUI[]
  onUpdateRoute: (patch: Partial<RouteCoverageUI>) => void
  onRemoveRoute: () => void
}

const DAYS_MAP = [
  { key: 'mon', label: 'จ' },
  { key: 'tue', label: 'อ' },
  { key: 'wed', label: 'พ' },
  { key: 'thu', label: 'พฤ' },
  { key: 'fri', label: 'ศ' },
  { key: 'sat', label: 'ส' },
  { key: 'sun', label: 'อา' },
]

export function BranchRouteItem({
  site,
  route,
  vendorBranches,
  onUpdateRoute,
  onRemoveRoute,
}: BranchRouteItemProps) {
  const toggleDay = (day: string) => {
    const nextDays = route.days.includes(day)
      ? route.days.filter(d => d !== day)
      : [...route.days, day]
    onUpdateRoute({ days: nextDays })
  }

  return (
    <div className="p-3.5 rounded-xl border bg-white space-y-3" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
            {site.name} ({site.nickname || site.code})
          </span>
          <span className="badge b-gray text-xs">{site.region || 'ทั่วไป'}</span>
        </div>
        <button
          type="button"
          onClick={onRemoveRoute}
          className="text-xs text-red-500 hover:text-red-700"
        >
          ยกเลิก
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onUpdateRoute({ transport: 'pickup' })}
          className={`py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 font-medium ${
            route.transport === 'pickup' ? 'bg-red-50 text-red-700 border-red-600' : 'bg-white text-slate-600'
          }`}
        >
          <Truck className="w-3.5 h-3.5" /> ไปรับเอง
        </button>
        <button
          type="button"
          onClick={() => onUpdateRoute({ transport: 'dc' })}
          className={`py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 font-medium ${
            route.transport === 'dc' ? 'bg-red-50 text-red-700 border-red-600' : 'bg-white text-slate-600'
          }`}
        >
          <Warehouse className="w-3.5 h-3.5" /> ผ่าน DC
        </button>
        <button
          type="button"
          onClick={() => onUpdateRoute({ transport: 'tpl' })}
          className={`py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 font-medium ${
            route.transport === 'tpl' ? 'bg-red-50 text-red-700 border-red-600' : 'bg-white text-slate-600'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" /> ผ่าน 3PL
        </button>
      </div>

      {route.transport === 'pickup' && (
        <div className="p-2.5 rounded-lg bg-slate-50 space-y-2 border text-xs" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">วันที่สะดวกเข้ารับ:</span>
            <div className="flex gap-1">
              {DAYS_MAP.map(d => (
                <button
                  type="button"
                  key={d.key}
                  onClick={() => toggleDay(d.key)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold ${
                    route.days.includes(d.key) ? 'bg-red-700 text-white' : 'bg-white border text-slate-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">รอบเวลา:</span>
            <select
              className="inp text-xs py-1 px-2 w-40"
              value={route.frequency}
              onChange={e => onUpdateRoute({ frequency: e.target.value })}
            >
              <option value="ทุกวัน">ทุกวัน</option>
              <option value="สัปดาห์ละ 2 ครั้ง">สัปดาห์ละ 2 ครั้ง</option>
              <option value="สัปดาห์ละ 1 ครั้ง">สัปดาห์ละ 1 ครั้ง</option>
            </select>
          </div>
        </div>
      )}

      {route.transport === 'tpl' && (
        <div className="p-2.5 rounded-lg bg-blue-50/50 space-y-2 border border-blue-200 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">ส่งไปยังสาขาของท่าน:</label>
            <select
              className="inp text-xs py-1 px-2"
              value={route.vendorDeliveryAddressId || ''}
              onChange={e => onUpdateRoute({ vendorDeliveryAddressId: e.target.value || null })}
            >
              <option value="">-- เลือกที่อยู่จัดส่งของท่าน --</option>
              {vendorBranches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.branchName} ({b.province || 'ไม่ระบุจังหวัด'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>ระยะเวลาจัดส่งโดยประมาณ:</span>
            <select
              className="inp text-xs py-1 px-2 w-32"
              value={route.transitDays}
              onChange={e => onUpdateRoute({ transitDays: e.target.value })}
            >
              <option value="1 วัน">1 วัน</option>
              <option value="2 วัน">2 วัน</option>
              <option value="2-3 วัน">2-3 วัน</option>
              <option value="3-5 วัน">3-5 วัน</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
