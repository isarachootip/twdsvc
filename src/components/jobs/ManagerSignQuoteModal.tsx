'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import SignatureCanvas from '@/components/ui/SignatureCanvas'
import { useToast } from '@/components/ui/Toast'

interface ManagerSignQuoteModalProps {
  open: boolean
  onClose: () => void
  jobId: string
  defaultManagerName?: string | null
  onSigned: (updatedQuote: unknown) => void
}

export default function ManagerSignQuoteModal({
  open,
  onClose,
  jobId,
  defaultManagerName,
  onSigned,
}: ManagerSignQuoteModalProps) {
  const [isProxy, setIsProxy] = useState(false)
  const [signerName, setSignerName] = useState(defaultManagerName || '')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setIsProxy(false)
      setSignerName(defaultManagerName || '')
      setSignatureUrl('')
    }
  }, [open, defaultManagerName])

  const handleProxyToggle = (checked: boolean) => {
    setIsProxy(checked)
    if (!checked) {
      setSignerName(defaultManagerName || '')
    } else if (signerName === defaultManagerName) {
      setSignerName('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = signerName.trim()
    if (!trimmedName) {
      toast('กรุณาระบุชื่อ-นามสกุลผู้ลงนาม', 'error')
      return
    }
    if (!signatureUrl) {
      toast('กรุณาจรดลายมือชื่อบนกระดานก่อนกดยืนยัน', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/quote/manager-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureUrl,
          signerName: trimmedName,
          isProxy,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'บันทึกการลงนามไม่สำเร็จ')

      toast('ลงนามอนุมัติใบเสนอราคาเรียบร้อยแล้ว', 'success')
      onSigned(data.quote)
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลงนาม', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} zIndex={95}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            ลงนามอนุมัติใบเสนอราคา (ผู้มีอำนาจสาขา)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ยืนยันการตรวจสอบและอนุมัติใบเสนอราคาก่อนส่งให้ลูกค้าตัดสินใจ
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
            <input
              type="checkbox"
              checked={isProxy}
              onChange={(e) => handleProxyToggle(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="font-medium">ปฏิบัติหน้าที่แทนผู้จัดการสาขา (Manager on duty)</span>
          </label>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <label className="text-slate-600 font-medium">
                {isProxy ? 'ชื่อ-นามสกุล ผู้ปฏิบัติหน้าที่แทน *' : 'ชื่อ-นามสกุล ผู้จัดการสาขา *'}
              </label>
              <span className="text-[11px] text-amber-700 font-medium">
                {isProxy ? 'ตำแหน่ง: Manager on duty' : 'ตำแหน่ง: ผู้จัดการสาขา'}
              </span>
            </div>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder={isProxy ? 'เช่น สมศรี ปฏิบัติงานแทน' : 'ชื่อผู้จัดการสาขา'}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-rose-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-medium block">
              ลายมือชื่อดิจิทัล *
            </label>
            <SignatureCanvas
              value={signatureUrl}
              onChange={setSignatureUrl}
              height={130}
              placeholder="จรดลายมือชื่อผู้จัดการสาขา / ผู้ปฏิบัติหน้าที่แทนที่นี่"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={submitting || !signerName.trim() || !signatureUrl}
            className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกการลงนาม'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
