'use client'

import { Phone } from 'lucide-react'
import { CUSTOMER_MILESTONES } from '@/lib/tracking-milestones'

interface TrackingJobDetailsCardProps {
  jobNo: string
  sku?: string | null
  serialNo?: string | null
  quantity?: number
  openedAt?: string
  customerName: string | null
  productName: string
  brandName: string
  symptom: string
  customerPhone: string | null
  estimatedCompletionDate: string
  branchName: string
  branchPhone: string | null
  currentMilestoneId: number
}

function fmtSlashDate(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function TrackingJobDetailsCard({
  jobNo,
  sku,
  serialNo,
  quantity = 1,
  openedAt,
  customerName,
  productName,
  brandName,
  symptom,
  customerPhone,
  estimatedCompletionDate,
  branchName,
  branchPhone,
  currentMilestoneId,
}: TrackingJobDetailsCardProps) {
  return (
    <>
      {/* Product & Branch Info Card (Aligned with LON Slides 6–10) */}
      <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
        <h3 className="font-bold text-xs text-[#2B2723] border-b border-[#E4DED2] pb-2">
          รายละเอียดใบส่งซ่อมสินค้า
        </h3>
        {customerName && (
          <div className="flex justify-between">
            <span className="text-[#6B6459]">เรียน:</span>
            <span className="font-medium text-[#2B2723]">{customerName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[#6B6459]">เลขที่ใบส่งซ่อมสินค้า:</span>
          <span className="font-mono font-bold text-[#2B2723]">{jobNo}</span>
        </div>
        {openedAt && (
          <div className="flex justify-between">
            <span className="text-[#6B6459]">วันที่ส่งซ่อม:</span>
            <span className="font-mono text-[#2B2723]">{fmtSlashDate(openedAt)}</span>
          </div>
        )}

        <div className="border-t border-[#F3EEE6] pt-2 space-y-1.5">
          <div className="font-semibold text-[#2B2723]">สินค้าซ่อม:</div>
          <div className="flex justify-between">
            <span className="text-[#6B6459]">SKU:</span>
            <span className="font-mono text-[#2B2723]">{sku || '-'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#6B6459] shrink-0">รายการ:</span>
            <span className="font-semibold text-[#2B2723] text-right">
              {productName} ({brandName})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B6459]">S/N:</span>
            <span className="font-mono text-[#2B2723]">{serialNo || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B6459]">จำนวน:</span>
            <span className="text-[#2B2723]">{quantity} ชิ้น</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#6B6459] shrink-0">สาเหตุ / อาการเสีย:</span>
            <span className="font-medium text-[#2B2723] text-right">{symptom || '-'}</span>
          </div>
        </div>

        {customerPhone && (
          <div className="flex justify-between border-t border-[#F3EEE6] pt-2">
            <span className="text-[#6B6459]">เบอร์โทรติดต่อ:</span>
            <span className="font-mono text-[#2B2723]">{customerPhone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[#6B6459]">กำหนดแล้วเสร็จโดยประมาณ:</span>
          <span className="font-semibold text-[#1D9E75]">
            {new Date(estimatedCompletionDate).toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B6459]">สาขาที่นำซ่อม / รับสินค้า:</span>
          <span className="font-medium text-[#2B2723]">{branchName}</span>
        </div>
        {branchPhone && (
          <div className="flex justify-between items-center pt-1">
            <span className="text-[#6B6459]">เบอร์ติดต่อสาขา:</span>
            <a href={`tel:${branchPhone}`} className="text-[#185FA5] font-semibold flex items-center gap-1">
              <Phone size={12} /> {branchPhone}
            </a>
          </div>
        )}
      </div>

      {/* 6 Customer Milestones Stepper (LON Slide 8) */}
      <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
        <h3 className="font-bold text-xs text-[#2B2723]">สถานะการซ่อมสินค้า (6 ขั้นตอน)</h3>
        <div className="space-y-3 pt-1">
          {CUSTOMER_MILESTONES.map((m, idx) => {
            const isDone = currentMilestoneId > m.id || currentMilestoneId === 6
            const isCurrent = currentMilestoneId === m.id && currentMilestoneId !== 6
            return (
              <div key={m.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isDone
                        ? 'bg-[#1D9E75] text-white'
                        : isCurrent
                        ? 'bg-[#C8102E] text-white ring-4 ring-[#FBE7E9]'
                        : 'bg-[#E4DED2] text-[#9A9384]'
                    }`}
                  >
                    {isDone ? '✓' : m.id}
                  </div>
                  {idx < CUSTOMER_MILESTONES.length - 1 && (
                    <div className={`w-0.5 h-5 ${isDone ? 'bg-[#1D9E75]' : 'bg-[#E4DED2]'}`} />
                  )}
                </div>
                <div className="pt-0.5">
                  <div
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-[#C8102E]' : isDone ? 'text-[#2B2723]' : 'text-[#9A9384]'
                    }`}
                  >
                    {m.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-2 border-t border-[#E4DED2] space-y-2">
          <a
            href="tel:1308"
            className="w-full py-2.5 rounded-xl bg-[#C8102E] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#9C0C22] transition-colors"
          >
            <Phone size={14} /> ติดต่อเจ้าหน้าที่ 1308
          </a>
          <p className="text-[11px] text-[#6B6459] text-center">
            หากต้องการสอบถามเพิ่มเติม สามารถติดต่อได้ที่ 1308 ในเวลาทำการ (07:00 – 20:00 น.)
          </p>
        </div>
      </div>
    </>
  )
}
