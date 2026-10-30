'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { ProductRatesSummaryTable } from './ProductRatesSummaryTable'

interface Step7CommercialGPProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
  onEditStep2?: () => void
}

export function Step7CommercialGP({ form, onChange, onEditStep2 }: Step7CommercialGPProps) {
  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={7}
        title="ส่วนแบ่ง GP และเงื่อนไขทางการค้า"
        subtitle="ตรวจสอบสรุปเปอร์เซ็นต์ส่วนแบ่ง GP รายกลุ่มสินค้า เครดิตเทอม และรอบการวางบิลจ่ายเงิน"
      />

      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
        <ProductRatesSummaryTable
          rates={form.productGroupRates || []}
          focusColumn="gp"
          onJumpToStep2={onEditStep2}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">7.1 เครดิตเทอมการชำระเงิน *</label>
            <div className="grid grid-cols-2 gap-2">
              {['30 วัน', '45 วัน', '60 วัน'].map(term => (
                <label
                  key={term}
                  className="inline-flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
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
            <label className="block font-bold text-slate-800 mb-1.5">7.2 รอบวางบิล / จ่ายเงิน</label>
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
