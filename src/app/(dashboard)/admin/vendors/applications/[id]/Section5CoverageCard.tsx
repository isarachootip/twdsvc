'use client'

import React from 'react'
import type { NormalizedVendorApplication } from '@/lib/vendor-application-types'
import { SectionCard, InfoItem } from './DetailFieldHelpers'

interface Section5CoverageCardProps {
  s5: NormalizedVendorApplication['section5']
}

export function Section5CoverageCard({ s5 }: Section5CoverageCardProps) {
  return (
    <SectionCard
      stepNo={5}
      title="พื้นที่ให้บริการและการจับคู่กับสาขาไทวัสดุ"
      subtitle="รัศมีการเดินทาง On-site และรายชื่อสาขาไทวัสดุที่ศูนย์บริการพร้อมดูแลรับผิดชอบ"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoItem label="รัศมีให้บริการจากสาขาไทวัสดุ (On-site)" value={s5.onsRadius} highlightClass="text-sky-700" />
        <InfoItem
          label="จำนวนสาขาไทวัสดุที่เลือกดูแล On-site"
          value={s5.activeRoutes.length > 0 ? `${s5.activeRoutes.length} สาขา` : 'ไม่ได้เลือกสาขา On-site'}
        />
      </div>

      {s5.activeRoutes.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96 print:max-h-none">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 print:static">
              <tr>
                <th className="py-2 px-3 font-semibold w-12 text-center">#</th>
                <th className="py-2 px-3 font-semibold">รหัส / สาขาไทวัสดุ</th>
                <th className="py-2 px-3 font-semibold">จังหวัด</th>
                <th className="py-2 px-3 font-semibold">ศูนย์บริการของคู่ค้าที่รับผิดชอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s5.activeRoutes.map((route, idx) => (
                <tr key={route.siteKey}>
                  <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-900">{route.siteDisplayName}</span>
                    {route.siteFullName !== route.siteDisplayName && (
                      <span className="text-[11px] text-slate-500 ml-1.5">({route.siteFullName})</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-700">{route.province}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{route.respBranchLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}
