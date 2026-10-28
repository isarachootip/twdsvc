'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { OnsiteLockNotice } from '../common/OnsiteLockNotice'

interface Step8SLAProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step8SLA({ form, onChange }: Step8SLAProps) {
  const hasOnsite = form.onsProducts.length > 0

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={8}
        title="SLA และมาตรฐานการบริการ"
        subtitle="ข้อตกลงระดับการให้บริการ (Service Level Agreement) ที่ต้องรักษาเพื่อความพึงพอใจของลูกค้า"
      />

      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="font-bold text-slate-800">8.1 มาตรฐานเวลาซ่อมเสร็จ Carry-in</label>
            <span className="text-[11px] font-semibold text-red-700">• Carry-in</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['3 วัน', '5 วัน', '7 วัน', '14 วัน'].map(sla => (
              <label key={sla} className="inline-flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="cinSlaDays"
                  value={sla}
                  checked={form.cinSlaDays === sla}
                  onChange={e => onChange({ cinSlaDays: e.target.value })}
                  className="accent-red-700"
                />
                <span className="font-semibold">{sla}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">นับจากวันที่ศูนย์บริการได้รับสินค้าจากสาขา/DC</p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-800">8.2 มาตรฐานเวลาบริการ On-site</label>
              <span className="text-[11px] font-semibold text-slate-600">• On-site</span>
            </div>
            {!hasOnsite && <OnsiteLockNotice />}
          </div>

          <fieldset disabled={!hasOnsite} className={!hasOnsite ? 'opacity-50 pointer-events-none' : ''}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 mb-1">ระยะเวลาติดต่อลูกค้านัดหมาย</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ภายใน 12 ชม.', 'ภายใน 24 ชม.'].map(opt => (
                    <label key={opt} className="inline-flex items-center gap-1.5 p-2 border border-slate-200 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="onsSlaApptHours"
                        value={opt}
                        checked={hasOnsite && form.onsSlaApptHours === opt}
                        onChange={e => onChange({ onsSlaApptHours: e.target.value })}
                        className="accent-red-700"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ระยะเวลาเข้าให้บริการหน้างาน</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ภายใน 2 วัน', 'ภายใน 3 วัน'].map(opt => (
                    <label key={opt} className="inline-flex items-center gap-1.5 p-2 border border-slate-200 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="onsSlaArrivalDays"
                        value={opt}
                        checked={hasOnsite && form.onsSlaArrivalDays === opt}
                        onChange={e => onChange({ onsSlaArrivalDays: e.target.value })}
                        className="accent-red-700"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  )
}
