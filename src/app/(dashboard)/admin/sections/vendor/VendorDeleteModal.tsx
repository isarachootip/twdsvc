'use client'

import React from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { VendorParentRow } from './vendor-types'

interface VendorDeleteModalProps {
  vendor: VendorParentRow | null
  onClose: () => void
  onConfirm: (vendor: VendorParentRow) => Promise<void>
  deleting: boolean
}

export function VendorDeleteModal({
  vendor,
  onClose,
  onConfirm,
  deleting,
}: VendorDeleteModalProps) {
  if (!vendor) return null

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3">
          <h3 className="text-base font-bold text-slate-900">
            ยืนยันการปิดใช้งานคู่ค้า {vendor.code}?
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            บริษัท: <span className="font-semibold text-slate-800">{vendor.name}</span>
          </p>
          <div className="mt-3 p-3 bg-amber-50 rounded-lg text-[11px] text-amber-800 leading-relaxed border border-amber-200/60">
            การปิดใช้งานจะทำให้คู่ค้านี้ไม่สามารถรับงานซ่อมใหม่ได้
            แต่ประวัติงานซ่อมและเอกสารย้อนหลังทั้งหมดจะยังคงอยู่ครบถ้วนในระบบ
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="btn btn-secondary text-xs px-4"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onConfirm(vendor)}
            className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'กำลังปิดใช้งาน...' : 'ยืนยันปิดใช้งาน'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
