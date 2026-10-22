'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'

interface Step7CommercialGPProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step7CommercialGP({ form, onChange }: Step7CommercialGPProps) {
  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={7}
        title="GP และเงื่อนไขทางการค้า"
        subtitle="ส่วนแบ่งเปอร์เซ็นต์ค่าบริการ เครดิตเทอม และรอบการวางบิลจ่ายเงิน"
      />

      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-800 mb-1.5">
            7.1 รูปแบบ GP ส่วนแบ่งเปอร์เซ็นต์ (%) *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['15%', '18%', '20%', '25%'].map(gp => (
              <label key={gp} className="inline-flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="gpPct"
                  value={gp}
                  checked={form.gpPct === gp}
                  onChange={e => onChange({ gpPct: e.target.value })}
                  className="accent-red-700"
                />
                <span className="font-semibold">{gp}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">ส่วนแบ่งมาตรฐานเครือข่ายศูนย์ซ่อมสินค้าไทวัสดุ (ทั่วไป 18%)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">7.2 เครดิตเทอมการชำระเงิน *</label>
            <div className="grid grid-cols-2 gap-2">
              {['30 วัน', '45 วัน', '60 วัน'].map(term => (
                <label key={term} className="inline-flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="creditTerm"
                    value={term}
                    checked={form.creditTerm === term}
                    onChange={e => onChange({ creditTerm: e.target.value })}
                    className="accent-red-700"
                  />
                  <span>{term}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5">รอบวางบิล / จ่ายเงิน</label>
            <input
              type="text"
              value={form.billingCycle}
              onChange={e => onChange({ billingCycle: e.target.value })}
              placeholder="เช่น ทุกวันที่ 25 ของเดือน"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
