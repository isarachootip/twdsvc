'use client'

import React from 'react'
import { Building2, Warehouse, CheckCircle2, Store } from 'lucide-react'
import { SiteDetailItem } from './branch-types'

interface BranchStatsCardsProps {
  sites: SiteDetailItem[]
}

export function BranchStatsCards({ sites }: BranchStatsCardsProps) {
  const total = sites.length
  const branchCount = sites.filter(s => s.type === 'BRANCH').length
  const dcCount = sites.filter(s => s.type === 'DC').length
  const activeCount = sites.filter(s => s.active).length
  const inactiveCount = total - activeCount

  const stats = [
    {
      title: 'สาขา/คลัง ทั้งหมด',
      value: total,
      sub: 'ทั่วประเทศ',
      icon: Store,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'สาขาไทวัสดุ (Branch)',
      value: branchCount,
      sub: 'จุดรับบริการและเปิดใบงาน',
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'คลังสินค้า (DC)',
      value: dcCount,
      sub: 'ศูนย์กระจายสินค้ากลาง',
      icon: Warehouse,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
    },
    {
      title: 'สถานะเปิดใช้งาน',
      value: activeCount,
      sub: inactiveCount > 0 ? `ปิดใช้งาน ${inactiveCount} แห่ง` : 'พร้อมให้บริการทุกแห่ง',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {stats.map((s, idx) => {
        const Icon = s.icon
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border bg-white shadow-sm flex items-center justify-between transition-all hover:shadow-md`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500">{s.title}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-800">{s.value}</span>
                <span className="text-xs text-slate-400">แห่ง</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
            </div>
            <div className={`p-2.5 rounded-lg border ${s.bg}`}>
              <Icon className={`w-5 h-5 ${s.color}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
