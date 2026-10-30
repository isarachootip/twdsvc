'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { ProductRatesSummaryTable } from './ProductRatesSummaryTable'

interface Step6PricingFeesProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
  onEditStep2?: () => void
}

export function Step6PricingFees({ form, onChange, onEditStep2 }: Step6PricingFeesProps) {
  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={6}
        title="เงื่อนไขราคา ค่าเปิดเครื่อง และค่าใช้จ่ายอื่น ๆ"
        subtitle="ตรวจสอบสรุปค่าเปิดเครื่องรายกลุ่มสินค้า และกำหนดเงื่อนไขการเรียกเก็บเงิน"
      />

      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
        <ProductRatesSummaryTable
          rates={form.productGroupRates || []}
          focusColumn="fee"
          onJumpToStep2={onEditStep2}
        />

        <div className="pt-3 border-t border-slate-100">
          <label className="block font-bold text-slate-800 mb-1.5">
            6.1 เงื่อนไขการเรียกเก็บเงินค่าเปิดซ่อมเครื่อง
          </label>
          <div className="space-y-2">
            {[
              'ซ่อมไม่ได้ไม่คิดเงิน ยกเว้นลูกค้ายกเลิกเองคิดค่าบริการตรวจเช็ค',
              'คิดค่าเปิดเครื่องทุกกรณีไม่ว่าจะซ่อมได้หรือไม่',
              'ฟรีค่าเปิดเครื่องกรณีลูกค้ายินยอมซ่อมตามใบเสนอราคา',
            ].map(cond => (
              <label
                key={cond}
                className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="feeCondition"
                  value={cond}
                  checked={form.feeCondition === cond}
                  onChange={e => onChange({ feeCondition: e.target.value })}
                  className="accent-red-700"
                />
                <span>{cond}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <label className="block font-semibold text-slate-700 mb-1">
            6.2 หมายเหตุราคา / ค่าบริการพิเศษเพิ่มเติม
          </label>
          <textarea
            value={form.priceNote}
            onChange={e => onChange({ priceNote: e.target.value })}
            placeholder="เช่น กรณีระยะทางเกิน 30 กม. คิดกิโลเมตรละ 10 บาท"
            rows={2}
            className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
          />
        </div>
      </div>
    </div>
  )
}
