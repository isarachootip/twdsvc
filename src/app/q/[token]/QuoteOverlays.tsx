'use client'

import { AlertCircle, X } from 'lucide-react'

export function QuoteRejectModal({
  open,
  branchName,
  rejectReason,
  onChangeReason,
  onConfirm,
  onClose,
  submitting,
}: {
  open: boolean
  branchName: string
  rejectReason: string
  onChangeReason: (v: string) => void
  onConfirm: () => void
  onClose: () => void
  submitting: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-[#E4DED2]">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-[#FBE7E9] text-[#C8102E] flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h3 className="font-bold text-base text-[#2B2723]">ยืนยันปฏิเสธซ่อม?</h3>
          <p className="text-xs text-[#6B6459] leading-relaxed">
            ค่าดำเนินการตรวจเช็คที่ชำระไว้ตอนเปิดงานจะไม่สามารถขอคืนได้ และสินค้าจะถูกจัดส่งกลับไปยังสาขา {branchName} เพื่อให้ท่านมารับคืนภายใน 7 วันหลังได้รับแจ้ง
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-[#6B6459]">เหตุผลที่ปฏิเสธซ่อม (ไม่บังคับ)</label>
          <textarea
            value={rejectReason}
            onChange={(e) => onChangeReason(e.target.value)}
            placeholder="เช่น ราคาซ่อมสูงเกินไป, เปลี่ยนใจซื้อใหม่..."
            rows={2}
            className="w-full p-2.5 border border-[#D2C9B8] rounded-xl text-xs outline-none focus:border-[#C8102E]"
          />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold text-xs hover:bg-[#9C0C22] transition-colors disabled:opacity-60"
          >
            {submitting ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธซ่อม'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-[#6B6459] text-xs hover:bg-gray-100 transition-colors"
          >
            ยกเลิก (กลับไปดูใบเสนอราคา)
          </button>
        </div>
      </div>
    </div>
  )
}

export function QuotePhotoLightbox({
  photoUrl,
  onClose,
}: {
  photoUrl: string | null
  onClose: () => void
}) {
  if (!photoUrl) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:opacity-80 p-1">
          <X size={24} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="ภาพขยาย"
          className="w-full h-auto max-h-[80vh] object-contain rounded-xl shadow-2xl bg-black"
        />
      </div>
    </div>
  )
}
