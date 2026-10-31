'use client'

import React from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
import type { AdminCustomVendorGroup } from './product-type-admin.types'

interface VendorCustomGroupsCardProps {
  items: AdminCustomVendorGroup[]
  promotingKey: string | null
  onPromote: (item: AdminCustomVendorGroup) => void
}

export function VendorCustomGroupsCard({
  items,
  promotingKey,
  onPromote,
}: VendorCustomGroupsCardProps) {
  if (items.length === 0) {
    return (
      <div className="pcard flex items-center gap-2.5 py-3 px-4">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-slate-600">
          ประเภทสินค้าทั้งหมดจากระบบสมัครคู่ค้า (Vendor Register) ซิงค์เข้ากับ Master กลางครบถ้วนแล้ว
        </p>
      </div>
    )
  }

  return (
    <div className="pcard space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <h3 className="text-sm font-bold text-slate-900">
            ประเภทสินค้าเพิ่มเติมจากระบบ Vendor Register ({items.length} รายการ)
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          รายการประเภทสินค้าที่คู่ค้าลงทะเบียนหรือพิมพ์เพิ่มเติมเข้ามา กดอนุมัติเพื่อเพิ่มเข้า Master กลางและเปิดให้ CS เลือกใช้งานทันที
        </p>
      </div>

      <div className="tbl-wrap">
        <table className="tbl compact text-xs">
          <thead>
            <tr>
              <th>รูปแบบบริการ</th>
              <th>ชื่อประเภทสินค้า</th>
              <th>คู่ค้าที่ลงทะเบียน</th>
              <th className="text-right">ค่าเปิดเครื่องที่เสนอ</th>
              <th className="text-right">GP (%) ที่เสนอ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.key}>
                <td>
                  <span
                    className={`inline-flex items-center gap-1.5 font-semibold ${
                      item.serviceType === 'CARRY_IN' ? 'text-red-700' : 'text-sky-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.serviceType === 'CARRY_IN' ? 'bg-red-600' : 'bg-sky-600'
                      }`}
                    />
                    {item.serviceType === 'CARRY_IN' ? 'Carry-in' : 'On-site'}
                  </span>
                </td>
                <td className="font-semibold text-slate-900">{item.name}</td>
                <td className="text-slate-600">
                  {item.vendorNames.slice(0, 3).join(', ')}
                  {item.vendorNames.length > 3 ? ` (+${item.vendorNames.length - 3})` : ''}
                </td>
                <td className="text-right font-semibold text-slate-800">
                  ฿{item.suggestedFee.toLocaleString()}
                </td>
                <td className="text-right font-semibold text-slate-800">{item.suggestedGpPct}%</td>
                <td className="text-right">
                  <button
                    type="button"
                    disabled={promotingKey === item.key}
                    onClick={() => onPromote(item)}
                    className="btn btn-primary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {promotingKey === item.key ? 'กำลังเพิ่ม...' : 'อนุมัติเข้า Master'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
