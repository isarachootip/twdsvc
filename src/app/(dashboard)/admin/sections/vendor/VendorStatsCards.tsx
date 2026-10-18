'use client'

import React from 'react'
import { Building2, ShieldCheck, MapPin, Award } from 'lucide-react'
import { VendorParentRow } from './vendor-types'

interface VendorStatsCardsProps {
  vendors: VendorParentRow[]
}

export function VendorStatsCards({ vendors }: VendorStatsCardsProps) {
  const totalVendors = vendors.length
  const authorizedCount = vendors.filter(v => v.isBrandAuthorized).length
  const totalCenters = vendors.reduce((acc, v) => acc + (v.centers?.length || 0), 0)
  const uniqueBrands = new Set(vendors.flatMap(v => v.brandIds || [])).size

  const stats = [
    {
      label: 'คู่ค้า VD ทั้งหมด',
      value: `${totalVendors} บริษัท`,
      icon: Building2,
      sub: 'ลงทะเบียนในระบบ',
      color: 'text-slate-800',
    },
    {
      label: 'ศูนย์แบรนด์ (Authorized)',
      value: `${authorizedCount} บริษัท`,
      icon: ShieldCheck,
      sub: `คิดเป็น ${totalVendors ? Math.round((authorizedCount / totalVendors) * 100) : 0}% ของคู่ค้า`,
      color: 'text-sky-700',
    },
    {
      label: 'ศูนย์บริการย่อย (สาขา)',
      value: `${totalCenters} จุดบริการ`,
      icon: MapPin,
      sub: 'ทั่วประเทศตามโซน',
      color: 'text-emerald-700',
    },
    {
      label: 'แบรนด์สินค้าที่รองรับ',
      value: `${uniqueBrands} แบรนด์`,
      icon: Award,
      sub: 'ครอบคลุมงานซ่อม',
      color: 'text-purple-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {stats.map((s, idx) => {
        const Icon = s.icon
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">{s.label}</span>
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
