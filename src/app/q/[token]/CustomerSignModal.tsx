'use client'

import React, { useState } from 'react'
import SignatureCanvas from '@/components/ui/SignatureCanvas'
import { CheckCircle2, X } from 'lucide-react'

interface CustomerSignModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (signatureUrl: string) => Promise<void>
  submitting: boolean
  quoteNo: string
  totalBaht: number
}

function formatBaht(satang: number): string {
  const b = satang / 100
  return `฿${b.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CustomerSignModal({
  open,
  onClose,
  onConfirm,
  submitting,
  quoteNo,
  totalBaht,
}: CustomerSignModalProps) {
  const [signatureUrl, setSignatureUrl] = useState('')

  if (!open) return null

  const handleConfirm = async () => {
    if (!signatureUrl || submitting) return
    await onConfirm(signatureUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-[#E4DED2] relative">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 p-1"
        >
          <X size={20} />
        </button>

        <div>
          <h3 className="font-bold text-base text-[#2B2723]">ลงนามอนุมัติการซ่อม</h3>
          <p className="text-xs text-[#6B6459] mt-0.5">
            ใบเสนอราคาเลขที่ {quoteNo} · ยอดรวมทั้งสิ้น {formatBaht(totalBaht)}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#2B2723] font-medium block">
            ลายมือชื่อลูกค้า (ใช้นิ้วหรือปากกาสไตลัสจรดเซ็นชื่อ) *
          </label>
          <SignatureCanvas
            value={signatureUrl}
            onChange={setSignatureUrl}
            height={140}
            placeholder="จรดนิ้วเพื่อลงลายมือชื่อที่นี่"
          />
        </div>

        <p className="text-[11px] text-[#9A9384] leading-relaxed">
          * การลงนามนี้ถือเป็นการตกลงยอมรับเงื่อนไขและราคาซ่อมตามใบเสนอราคาของศูนย์บริการซ่อมไทวัสดุ
        </p>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !signatureUrl}
            className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold text-xs hover:bg-[#9C0C22] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            {submitting ? 'กำลังบันทึกการอนุมัติ...' : 'ยืนยันการอนุมัติซ่อม'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-[#6B6459] text-xs hover:bg-gray-100 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}
