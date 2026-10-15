'use client'

import { useRef } from 'react'
import { X, Printer } from 'lucide-react'
import QuoteDoc, { type QuoteDocData } from '@/components/jobs/QuoteDoc'
import { printElement } from '@/lib/print-element'

export interface PublicQuoteA4ModalProps {
  open: boolean
  onClose: () => void
  data: QuoteDocData
}

export default function PublicQuoteA4Modal({ open, onClose, data }: PublicQuoteA4ModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full p-4 md:p-6 shadow-2xl border border-[#E4DED2] max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 no-print">
          <div className="font-bold text-sm text-slate-800">
            เอกสารใบเสนอราคาซ่อมมาตรฐาน (A4)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printElement(printRef.current, `ใบเสนอราคาซ่อม ${data.quoteNo}`)}
              className="px-3 py-1.5 rounded-lg bg-[#C8102E] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#9C0C22] transition-colors"
            >
              <Printer size={14} />
              พิมพ์ / บันทึก PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="ปิด"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div ref={printRef}>
          <QuoteDoc q={data} />
        </div>
      </div>
    </div>
  )
}
