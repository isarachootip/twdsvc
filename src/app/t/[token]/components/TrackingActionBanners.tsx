'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { formatSatang } from '@/lib/fees'
import type { Stage } from '@/lib/constants'

interface ActiveQuoteInfo {
  quoteNo: string
  status: string
  total: number
  repairDays?: number
  quoteUrl: string | null
}

interface TrackingActionBannersProps {
  stage: Stage
  activeQuote: ActiveQuoteInfo | null
  balance: number
  payUrl?: string | null
  csatUrl?: string | null
}

export default function TrackingActionBanners({
  stage,
  activeQuote,
  balance,
  payUrl,
  csatUrl,
}: TrackingActionBannersProps) {
  return (
    <>
      {/* Urgent Action Banner: Quote Waiting */}
      {stage === 'WAITING_APPROVAL' && activeQuote && (
        <div className="bg-[#FBE7E9] border-2 border-[#C8102E] p-4 rounded-2xl text-center space-y-2 shadow-sm">
          <span className="text-xs font-bold text-[#9C0C22] uppercase tracking-wide">
            ⚡ ใบเสนอราคาซ่อมพร้อมให้ท่านตรวจสอบแล้ว
          </span>
          <p className="text-sm font-semibold text-[#2B2723]">
            ยอดค่าซ่อมรวม <b>{formatSatang(activeQuote.total)}</b>
          </p>
          {activeQuote.quoteUrl && (
            <Link
              href={activeQuote.quoteUrl}
              className="block w-full py-2.5 rounded-xl bg-[#C8102E] text-white font-bold text-xs shadow hover:bg-[#9C0C22] transition-colors"
            >
              ดูใบเสนอราคาและกดอนุมัติ ↗
            </Link>
          )}
        </div>
      )}

      {/* Payment banner if balance > 0 */}
      {balance > 0 && payUrl && stage !== 'WAITING_APPROVAL' && (
        <div className="bg-[#FAEEDA] border border-[#BA7517] p-4 rounded-2xl text-center space-y-2 shadow-sm">
          <div className="text-xs font-bold text-[#BA7517]">มียอดค่าบริการค้างชำระ</div>
          <p className="text-base font-bold text-[#2B2723] font-mono">{formatSatang(balance)}</p>
          <Link
            href={payUrl}
            className="block w-full py-2.5 rounded-xl bg-[#1D9E75] text-white font-bold text-xs shadow hover:opacity-95"
          >
            ชำระเงินออนไลน์ทันที ↗
          </Link>
        </div>
      )}

      {/* CSAT Survey banner if closed */}
      {csatUrl && (
        <div className="bg-[#E1F5EE] border border-[#1D9E75] p-4 rounded-2xl text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[#1D9E75] text-xs font-bold">
            <Star size={16} fill="currentColor" /> ประเมินความพึงพอใจ
          </div>
          <p className="text-xs text-[#2B2723]">งานซ่อมเสร็จสิ้นแล้ว ช่วยประเมินบริการให้เราหน่อยนะคะ</p>
          <Link
            href={csatUrl}
            className="block w-full py-2.5 rounded-xl bg-[#1D9E75] text-white font-bold text-xs shadow hover:opacity-95"
          >
            ให้คะแนนบริการ (CSAT) ★★★★★
          </Link>
        </div>
      )}
    </>
  )
}
