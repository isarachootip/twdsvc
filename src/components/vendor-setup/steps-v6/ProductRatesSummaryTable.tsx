'use client'

import React from 'react'
import { Pencil } from 'lucide-react'
import type { ProductGroupRateConfig } from '@/lib/validations/vendor-product-group.schema'

interface ProductRatesSummaryTableProps {
  rates: ProductGroupRateConfig[]
  focusColumn?: 'fee' | 'gp'
  onJumpToStep2?: () => void
}

function formatOnsiteTasks(tasks?: { repair: boolean; replacePart: boolean; install: boolean }): string {
  if (!tasks) return '-'
  const list: string[] = []
  if (tasks.repair) list.push('ซ่อม')
  if (tasks.replacePart) list.push('เปลี่ยนอะไหล่')
  if (tasks.install) list.push('ติดตั้ง')
  return list.length > 0 ? list.join(', ') : '-'
}

export function ProductRatesSummaryTable({
  rates,
  focusColumn = 'fee',
  onJumpToStep2,
}: ProductRatesSummaryTableProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800">
          ตารางสรุปค่าเปิดเครื่องขั้นต่ำและ GP (%) รายกลุ่มสินค้า (กำหนดไว้ในขั้นตอนที่ 2)
        </span>
        {onJumpToStep2 && (
          <button
            type="button"
            onClick={onJumpToStep2}
            className="text-xs font-semibold text-red-700 hover:text-red-800 inline-flex items-center gap-1"
          >
            <Pencil className="w-3.5 h-3.5" /> แก้ไขรายกลุ่มสินค้าในขั้นตอนที่ 2
          </button>
        )}
      </div>

      {rates.length === 0 ? (
        <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
          ยังไม่ได้เลือกกลุ่มสินค้าในขั้นตอนที่ 2
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 font-semibold">รูปแบบบริการ</th>
                <th className="py-2 px-3 font-semibold">กลุ่มสินค้า</th>
                <th className="py-2 px-3 font-semibold text-right">ค่าเปิดเครื่องขั้นต่ำ</th>
                <th className="py-2 px-3 font-semibold text-right">ส่วนแบ่ง GP</th>
                <th className="py-2 px-3 font-semibold">ขอบเขตงาน On-site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rates.map(r => (
                <tr key={`${r.serviceType}:${r.groupName}`} className="bg-white">
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold ${
                        r.serviceType === 'CARRY_IN' ? 'text-red-700' : 'text-sky-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          r.serviceType === 'CARRY_IN' ? 'bg-red-600' : 'bg-sky-600'
                        }`}
                      />
                      {r.serviceType === 'CARRY_IN' ? 'Carry-in' : 'On-site'}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800">
                    <span>{r.groupName}</span>
                    {r.isCustomGroup && (
                      <span className="ml-2 text-[11px] font-medium text-amber-700">• กลุ่มเพิ่มเติม</span>
                    )}
                  </td>
                  <td
                    className={`py-2 px-3 text-right ${
                      focusColumn === 'fee' ? 'font-bold text-emerald-700' : 'font-semibold text-slate-700'
                    }`}
                  >
                    ฿{r.minInspectionFee.toLocaleString()}
                  </td>
                  <td
                    className={`py-2 px-3 text-right ${
                      focusColumn === 'gp' ? 'font-bold text-emerald-700' : 'font-semibold text-slate-700'
                    }`}
                  >
                    {r.gpPct}%
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {r.serviceType === 'ON_SITE' ? formatOnsiteTasks(r.tasks) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
