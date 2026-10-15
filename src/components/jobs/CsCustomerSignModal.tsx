'use client'

import React, { useState, useEffect } from 'react'
import SignatureCanvas from '@/components/ui/SignatureCanvas'
import { CheckCircle2, X } from 'lucide-react'

interface CsCustomerSignModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (signatureUrl: string) => Promise<void>
  title: string
  subtitle?: string
  disclaimer?: string
  submitting?: boolean
}

export default function CsCustomerSignModal({
  open,
  onClose,
  onConfirm,
  title,
  subtitle,
  disclaimer,
  submitting = false,
}: CsCustomerSignModalProps) {
  const [signatureUrl, setSignatureUrl] = useState('')

  useEffect(() => {
    if (open) {
      setSignatureUrl('')
    }
  }, [open])

  if (!open) return null

  const handleConfirm = async () => {
    if (!signatureUrl || submitting) return
    await onConfirm(signatureUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 p-1 rounded"
        >
          <X size={20} />
        </button>

        <div>
          <h3 className="font-bold text-base text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-700 font-medium block">
            ลายมือชื่อลูกค้า (ใช้นิ้ว ปากกาสไตลัส หรือเมาส์เพื่อลงลายมือชื่อ) *
          </label>
          <SignatureCanvas
            value={signatureUrl}
            onChange={setSignatureUrl}
            height={160}
            placeholder="จรดนิ้วหรือปากกาเพื่อลงลายมือชื่อที่นี่"
          />
        </div>

        {disclaimer && (
          <p className="text-[11px] text-slate-500 leading-relaxed">
            * {disclaimer}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !signatureUrl}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            {submitting ? 'กำลังบันทึก...' : 'ยืนยันลายมือชื่อ'}
          </button>
        </div>
      </div>
    </div>
  )
}
