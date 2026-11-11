'use client'

import React from 'react'
import type { NormalizedVendorApplication } from '@/lib/vendor-application-types'
import { SectionCard, InfoItem, InlineDotList } from './DetailFieldHelpers'

function fmtMetric(val: number | null, unit: string): string {
  return val !== null ? `${val.toLocaleString()} ${unit}` : '-'
}

interface Section3And4OperationsCardProps {
  s3: NormalizedVendorApplication['section3']
  s4: NormalizedVendorApplication['section4']
}

export function Section3And4OperationsCard({ s3, s4 }: Section3And4OperationsCardProps) {
  const cinTimeRange =
    s4.cinOpen !== '-' || s4.cinClose !== '-' ? `${s4.cinOpen} - ${s4.cinClose} น.` : '-'
  const cinPickRange =
    s4.cinPickStart !== '-' || s4.cinPickEnd !== '-' ? `${s4.cinPickStart} - ${s4.cinPickEnd} น.` : '-'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SectionCard
        stepNo={3}
        title="ทีมช่างและกำลังการให้บริการ"
        subtitle="อัตรากำลังคนและขีดความสามารถในการรองรับปริมาณงานซ่อม"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InfoItem label="3.1 ช่างประจำทั้งหมด" value={fmtMetric(s3.techTotal, 'คน')} />
          <InfoItem label="ช่าง Outsource" value={fmtMetric(s3.techOut, 'คน')} />
          <InfoItem label="3.2 ช่าง On-site" value={fmtMetric(s3.onsTech, 'คน')} />
          <InfoItem label="ทีมออกงานพร้อมกัน" value={fmtMetric(s3.onsTeams, 'ทีม')} />
          <InfoItem label="ช่าง / ทีมสำรอง" value={fmtMetric(s3.onsBackup, 'คน')} />
          <InfoItem
            label="รับงานสูงสุด (ต่อวัน)"
            value={fmtMetric(s3.onsCapDay, 'งาน/วัน')}
            highlightClass="text-emerald-700"
          />
          <InfoItem
            label="รับงานสูงสุด (ต่อเดือน)"
            value={fmtMetric(s3.onsCapMonth, 'งาน/เดือน')}
            highlightClass="text-emerald-700"
          />
        </div>
      </SectionCard>

      <SectionCard
        stepNo={4}
        title="วันและเวลาทำการ"
        subtitle="เวลาเปิดทำการศูนย์ซ่อม รอบรับ-ส่งสินค้า และคิวนัดหมาย On-site"
      >
        <div className="space-y-3">
          <div>
            <span className="font-bold text-red-700 block mb-1">4.1 วันและเวลาทำการ Carry-in</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">วันเปิดศูนย์ซ่อม</span>
                <InlineDotList items={s4.cinDays} dotColorClass="bg-red-600" />
              </div>
              <InfoItem label="เวลาเปิด - ปิดศูนย์ซ่อม" value={cinTimeRange} />
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">วันเข้ารับ-ส่งสินค้าที่สาขา / DC</span>
                <InlineDotList items={s4.cinPickDays} dotColorClass="bg-amber-600" />
              </div>
              <InfoItem label="ช่วงเวลารับ-ส่งสินค้า" value={cinPickRange} />
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100">
            <span className="font-bold text-sky-700 block mb-1">4.2 วันและเวลาทำการ On-site</span>
            <div className="mb-2">
              <span className="text-[11px] text-slate-500 block mb-0.5">วันที่พร้อมออกให้บริการ On-site</span>
              <InlineDotList items={s4.onsDays} dotColorClass="bg-sky-600" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <InfoItem label="เวลาเริ่มออกบริการ" value={s4.onsHours !== '-' ? `${s4.onsHours} น.` : '-'} />
              <InfoItem label="เวลารับนัดหมาย" value={s4.onsAppt !== '-' ? `${s4.onsAppt} น.` : '-'} />
              <InfoItem label="นัดหมายเร็วสุด" value={fmtMetric(s4.onsFast, 'ชม.')} />
              <InfoItem label="จำนวนคิวต่อวัน" value={fmtMetric(s4.onsQueue, 'คิว/วัน')} />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
