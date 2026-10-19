'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import SignatureCanvas from '@/components/ui/SignatureCanvas'
import { useManagerReviewModal } from './useManagerReviewModal'

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
  const {
    mode,
    setMode,
    isProxy,
    handleProxyToggle,
    signerName,
    setSignerName,
    signatureUrl,
    setSignatureUrl,
    reason,
    setReason,
    submitting,
    handleSubmit,
  } = useManagerReviewModal({ open, jobId, defaultManagerName, onSigned, onClose })

  return (
    <Modal open={open} onClose={onClose} zIndex={95}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            พิจารณาและลงนามใบเสนอราคา (ผู้จัดการสาขา)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจสอบความถูกต้องของรายการประเมินราคาก่อนดำเนินการ
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode('sign')}
            className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
              mode === 'sign' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ✓ อนุมัติ & ลงนาม
          </button>
          <button
            type="button"
            onClick={() => setMode('request_revision')}
            className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
              mode === 'request_revision' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ↺ ส่งกลับให้ช่างประเมินใหม่
          </button>
          <button
            type="button"
            onClick={() => setMode('reject')}
            className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
              mode === 'reject' ? 'border-rose-700 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ✕ ไม่อนุมัติ / ยกเลิกซ่อม
          </button>
        </div>

        {mode === 'sign' ? (
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
              <label className="text-xs text-slate-600 font-medium block">ลายมือชื่อดิจิทัล *</label>
              <SignatureCanvas
                value={signatureUrl}
                onChange={setSignatureUrl}
                height={120}
                placeholder="จรดลายมือชื่อผู้จัดการสาขา / ผู้ปฏิบัติหน้าที่แทนที่นี่"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs text-slate-600 font-medium block">
              {mode === 'request_revision' ? 'เหตุผลที่ส่งกลับให้ช่างประเมินใหม่ *' : 'เหตุผลที่ไม่อนุมัติการซ่อม *'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === 'request_revision' ? 'ระบุจุดที่ต้องการให้ช่างตรวจสอบหรือปรับปรุงราคา...' : 'ระบุสาเหตุที่ไม่สามารถอนุมัติการซ่อมได้...'}
              rows={3}
              required
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-rose-600"
            />
            <p className="text-[11px] text-slate-500">
              {mode === 'request_revision'
                ? 'ระบบจะส่งงานกลับไปยังคิวช่าง (VD_INSPECTING) เพื่อให้ประเมินราคาใหม่'
                : 'ระบบจะย้ายงานไปยังขั้นตอนเตรียมส่งคืนสินค้า (RETURN_PACKING)'}
            </p>
          </div>
        )}

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
            disabled={submitting || (mode === 'sign' ? !signerName.trim() || !signatureUrl : !reason.trim())}
            className={`px-4 py-2 text-xs font-medium text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 ${
              mode === 'request_revision'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {submitting ? 'กำลังบันทึก...' : mode === 'sign' ? 'บันทึกการลงนามอนุมัติ' : mode === 'request_revision' ? 'ยืนยันส่งกลับให้ช่าง' : 'ยืนยันไม่อนุมัติ'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
