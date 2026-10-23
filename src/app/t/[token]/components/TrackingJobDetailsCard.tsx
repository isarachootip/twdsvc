'use client'

import { Phone } from 'lucide-react'
import { CUSTOMER_MILESTONES } from '@/lib/tracking-milestones'

interface TrackingJobDetailsCardProps {
  jobNo: string
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

export default function TrackingJobDetailsCard({
  jobNo,
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
      {/* Product & Branch Info Card */}
      <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
        <h3 className="font-bold text-xs text-[#2B2723] border-b border-[#E4DED2] pb-2">
          รายละเอียดงานแจ้งซ่อม
        </h3>
        <div className="flex justify-between">
          <span className="text-[#6B6459]">เลขที่งาน:</span>
          <span className="font-mono font-bold text-[#2B2723]">{jobNo}</span>
        </div>
        {customerName && (
          <div className="flex justify-between">
            <span className="text-[#6B6459]">ชื่อลูกค้า:</span>
            <span className="font-medium text-[#2B2723]">{customerName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[#6B6459]">สินค้า:</span>
          <span className="font-semibold text-[#2B2723]">{productName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B6459]">แบรนด์:</span>
          <span>{brandName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B6459]">อาการเสีย:</span>
          <span className="font-medium text-[#2B2723] text-right">{symptom || '-'}</span>
        </div>
        {customerPhone && (
          <div className="flex justify-between">
            <span className="text-[#6B6459]">เบอร์โทรติดต่อ:</span>
            <span className="font-mono text-[#2B2723]">{customerPhone}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#E4DED2] pt-2">
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
          <span className="text-[#6B6459]">สาขาที่รับเครื่อง:</span>
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

      {/* 5 Customer Milestones Stepper */}
      <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
        <h3 className="font-bold text-xs text-[#2B2723]">ขั้นตอนการซ่อม</h3>
        <div className="space-y-3 pt-1">
          {CUSTOMER_MILESTONES.map((m, idx) => {
            const isDone = currentMilestoneId > m.id
            const isCurrent = currentMilestoneId === m.id
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
                    <div className={`w-0.5 h-6 ${isDone ? 'bg-[#1D9E75]' : 'bg-[#E4DED2]'}`} />
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
      </div>
    </>
  )
}
