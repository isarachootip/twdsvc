'use client'

import React from 'react'
import type { NormalizedVendorApplication } from '@/lib/vendor-application-types'
import { SectionCard, InfoItem, InlineDotList } from './DetailFieldHelpers'

interface Section6To9CommercialSafetyCardProps {
  s6: NormalizedVendorApplication['section6']
  s7: NormalizedVendorApplication['section7']
  s8: NormalizedVendorApplication['section8']
  s9: NormalizedVendorApplication['section9']
}

export function Section6To9CommercialSafetyCard({
  s6,
  s7,
  s8,
  s9,
}: Section6To9CommercialSafetyCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SectionCard
        stepNo={6}
        title="เงื่อนไขราคา ค่าเปิดเครื่อง และค่าใช้จ่ายอื่น ๆ"
        subtitle="เงื่อนไขการเรียกเก็บเงินค่าตรวจเช็คและหมายเหตุค่าบริการพิเศษ"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoItem
            label="ค่าเปิดเครื่องอ้างอิง Carry-in"
            value={s6.cinFee !== '-' ? `฿${s6.cinFee}` : '-'}
            highlightClass="text-emerald-700"
          />
          <InfoItem
            label="ค่าเปิดเครื่องอ้างอิง On-site"
            value={s6.onsFee !== '-' ? `฿${s6.onsFee}` : '-'}
            highlightClass="text-emerald-700"
          />
        </div>
        <InfoItem label="6.1 เงื่อนไขการเรียกเก็บเงินค่าเปิดซ่อมเครื่อง" value={s6.feeCondition} />
        <InfoItem label="6.2 หมายเหตุราคา / ค่าบริการพิเศษเพิ่มเติม" value={s6.priceNote} />
      </SectionCard>

      <SectionCard
        stepNo={7}
        title="ส่วนแบ่ง GP และเงื่อนไขทางการค้า"
        subtitle="เปอร์เซ็นต์ส่วนแบ่งอ้างอิง เครดิตเทอม และรอบวางบิลชำระเงิน"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoItem label="GP อ้างอิงหลัก" value={s7.gpPct} />
          <InfoItem label="7.1 เครดิตเทอมการชำระเงิน" value={s7.creditTerm} />
          <InfoItem
            label="7.2 รอบวางบิล / จ่ายเงิน"
            value={s7.billingCycle}
            highlightClass="text-emerald-700"
          />
        </div>
      </SectionCard>

      <SectionCard
        stepNo={8}
        title="SLA และมาตรฐานเวลาให้บริการ"
        subtitle="ข้อตกลงระยะเวลาซ่อมเสร็จ Carry-in และการนัดหมายเข้าหน้างาน On-site"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoItem label="8.1 เวลาซ่อมเสร็จ Carry-in" value={s8.cinSlaDays} highlightClass="text-red-700" />
          <InfoItem label="8.2 ติดต่อลูกค้านัดหมาย (On-site)" value={s8.onsSlaApptHours} highlightClass="text-sky-700" />
          <InfoItem label="เข้าให้บริการหน้างาน (On-site)" value={s8.onsSlaArrivalDays} highlightClass="text-sky-700" />
        </div>
      </SectionCard>

      <SectionCard
        stepNo={9}
        title="การรับประกัน ความรับผิดชอบ และความปลอดภัย"
        subtitle="ความรับผิดชอบกรณีทรัพย์สินเสียหาย มาตรฐานความปลอดภัยช่าง และเครื่องมือประจำทีม"
      >
        <InfoItem label="9.1 ประกันภัยและความรับผิดชอบเมื่อสินค้าเสียหายหรือสูญหาย" value={s9.damageLiability} />
        <div>
          <span className="text-[11px] text-slate-500 block mb-1">
            9.2 มาตรฐานความปลอดภัยและภาพลักษณ์ช่าง On-site ({s9.safetyStandards.length})
          </span>
          <InlineDotList items={s9.safetyStandards} dotColorClass="bg-emerald-600" textColorClass="text-slate-800" />
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block mb-1">
            9.3 รายการอุปกรณ์และเครื่องมือช่าง On-site ({s9.onsiteTools.length})
          </span>
          <InlineDotList items={s9.onsiteTools} dotColorClass="bg-slate-500" textColorClass="text-slate-800" />
        </div>
      </SectionCard>
    </div>
  )
}
