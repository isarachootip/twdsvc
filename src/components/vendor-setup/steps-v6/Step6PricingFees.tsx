'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { OnsiteLockNotice } from '../common/OnsiteLockNotice'

interface Step6PricingFeesProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step6PricingFees({ form, onChange }: Step6PricingFeesProps) {
  const hasOnsite = form.onsProducts.length > 0

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={6}
        title="ราคา ค่าเปิดเครื่อง และค่าใช้จ่ายอื่น ๆ"
        subtitle="กำหนดโครงสร้างราคาค่าตรวจเช็ค ค่าเปิดเครื่อง และอัตราค่าบริการมาตรฐาน"
      />

      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              6.1 ค่าเปิดเครื่อง / ตรวจเช็ค Carry-in (บาท) *
            </label>
            <input
              type="text"
              value={form.cinFee}
              onChange={e => onChange({ cinFee: e.target.value })}
              placeholder="เช่น 300"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">อัตราค่าบริการตรวจเช็คสินค้าที่ส่งมาซ่อมที่ศูนย์</p>
          </div>

          <fieldset disabled={!hasOnsite} className={!hasOnsite ? 'opacity-50 pointer-events-none' : ''}>
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <label className="font-bold text-slate-800">
                6.2 ค่าเปิดเครื่อง / เข้าหน้างาน On-site (บาท) {hasOnsite ? '*' : ''}
              </label>
              {!hasOnsite && <OnsiteLockNotice />}
            </div>
            <input
              type="text"
              disabled={!hasOnsite}
              value={hasOnsite ? form.onsFee : ''}
              onChange={e => onChange({ onsFee: e.target.value })}
              placeholder="เช่น 500"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">อัตราค่าบริการเดินทางและตรวจเช็คหน้างานลูกค้า</p>
          </fieldset>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 mb-1.5">
            6.3 เงื่อนไขการเรียกเก็บเงินค่าเปิดซ่อมเครื่อง
          </label>
          <div className="space-y-2">
            {[
              'ซ่อมไม่ได้ไม่คิดเงิน ยกเว้นลูกค้ายกเลิกเองคิดค่าบริการตรวจเช็ค',
              'คิดค่าเปิดเครื่องทุกกรณีไม่ว่าจะซ่อมได้หรือไม่',
              'ฟรีค่าเปิดเครื่องกรณีลูกค้ายินยอมซ่อมตามใบเสนอราคา',
            ].map(cond => (
              <label key={cond} className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
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
          <label className="block font-semibold text-slate-700 mb-1">หมายเหตุราคา / ค่าบริการพิเศษเพิ่มเติม</label>
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
