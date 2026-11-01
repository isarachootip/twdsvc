'use client'

import Link from 'next/link'
import { CheckCircle2, ChevronRight, Clock, ImageIcon, Phone } from 'lucide-react'
import type { QuoteData } from './quote-types'

function fmtSlashDate(iso?: string | null): string {
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

export function QuoteJobSummaryCard({
  data,
  onSelectPhoto,
}: {
  data: QuoteData
  onSelectPhoto: (url: string) => void
}) {
  const { job } = data

  return (
    <>
      <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
        {job.customerName && (
          <div className="flex justify-between border-b border-[#E4DED2] pb-2">
            <span className="text-[#6B6459]">เรียน</span>
            <span className="font-medium text-[#2B2723]">{job.customerName}</span>
          </div>
        )}
        <div className="flex justify-between items-center border-b border-[#E4DED2] pb-2">
          <span className="text-[#6B6459]">เลขที่ใบส่งซ่อมสินค้า</span>
          <span className="font-bold text-[#2B2723] font-mono text-sm">{job.jobNo}</span>
        </div>
        {job.openedAt && (
          <div className="flex justify-between border-b border-[#E4DED2] pb-2">
            <span className="text-[#6B6459]">วันที่ส่งซ่อม</span>
            <span className="font-mono text-[#2B2723]">{fmtSlashDate(job.openedAt)}</span>
          </div>
        )}
        <div className="flex justify-between border-b border-[#E4DED2] pb-2 gap-3">
          <span className="text-[#6B6459] shrink-0">สินค้า</span>
          <span className="font-medium text-[#2B2723] text-right">
            {job.productName} ({job.brandName})
          </span>
        </div>
        {job.symptom && (
          <div className="flex justify-between border-b border-[#E4DED2] pb-2 gap-3">
            <span className="text-[#6B6459] shrink-0">สาเหตุแจ้งซ่อม</span>
            <span className="text-[#2B2723] text-right">{job.symptom}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[#6B6459]">สาขาที่นำซ่อม</span>
          <span className="text-[#2B2723]">{job.branchName}</span>
        </div>
      </div>

      {data.photos && data.photos.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2723]">
            <ImageIcon size={15} className="text-[#C8102E]" />
            <span>ภาพถ่ายตรวจสภาพสินค้า ({data.photos.length} รูป)</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {data.photos.map((photoUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPhoto(photoUrl)}
                className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-[#D2C9B8]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt={`ภาพตรวจสภาพ ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export function QuoteDecisionActions({
  data,
  submitting,
  onApproveClick,
  onRejectClick,
}: {
  data: QuoteData
  submitting: boolean
  onApproveClick: () => void
  onRejectClick: () => void
}) {
  const isManagerSigned = Boolean(data.quote.managerSignedAt)

  return (
    <div className="space-y-2.5 pt-1">
      {!data.decided && !data.expired && (
        <div className="grid grid-cols-2 gap-2.5">
          {isManagerSigned ? (
            <button
              type="button"
              onClick={onApproveClick}
              disabled={submitting}
              className="py-3.5 px-3 rounded-xl bg-[#C8102E] text-white font-bold text-xs shadow hover:bg-[#9C0C22] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              {submitting ? 'กำลังบันทึก...' : 'อนุมัติซ่อม'}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="py-3.5 px-3 rounded-xl bg-slate-200 text-slate-500 font-medium text-[11px] cursor-not-allowed flex items-center justify-center gap-1"
            >
              <Clock size={14} /> รอผจก.ลงนาม
            </button>
          )}
          <button
            type="button"
            onClick={onRejectClick}
            disabled={submitting}
            className="py-3.5 px-3 rounded-xl bg-white text-[#6B6459] border border-[#D2C9B8] font-bold text-xs hover:bg-[#F3EEE6] transition-colors disabled:opacity-60"
          >
            ปฏิเสธซ่อม
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {data.payUrl ? (
          <Link
            href={data.payUrl}
            className="py-3 px-3 rounded-xl bg-[#1D9E75] text-white font-bold text-xs shadow hover:opacity-95 flex items-center justify-center gap-1 text-center"
          >
            Link การชำระเงิน <ChevronRight size={15} />
          </Link>
        ) : (
          <div className="py-3 px-3 rounded-xl bg-[#F3EEE6] text-[#9A9384] font-medium text-[11px] flex items-center justify-center text-center">
            Link การชำระเงิน (หลังอนุมัติ)
          </div>
        )}
        <a
          href={`tel:${data.job.branchPhone || '1308'}`}
          className="py-3 px-3 rounded-xl bg-white text-[#2B2723] border border-[#D2C9B8] font-semibold text-xs hover:bg-[#F3EEE6] flex items-center justify-center gap-1.5"
        >
          <Phone size={14} className="text-[#C8102E]" /> สอบถามเพิ่มเติม
        </a>
      </div>
    </div>
  )
}
