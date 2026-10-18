'use client'

import React from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface VendorSetupSuccessViewProps {
  result: {
    applicationNo: string
    score: number
    estimatedTier: string
    directApproved?: boolean
  }
  onFinish?: () => void
}

export function VendorSetupSuccessView({ result, onFinish }: VendorSetupSuccessViewProps) {
  const isDirect = Boolean(result.directApproved)

  return (
    <div
      className="max-w-2xl mx-auto p-8 rounded-3xl border bg-white text-center space-y-5 shadow-xs"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-800">
          {isDirect ? 'เปิดใช้งานคู่ค้าใหม่เรียบร้อยแล้ว' : 'ส่งใบสมัครเข้าร่วมเป็นคู่ค้าเรียบร้อยแล้ว'}
        </h3>
        <p className="text-xs text-slate-500">
          เลขที่อ้างอิง: <span className="font-bold text-red-700">{result.applicationNo}</span>
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 inline-block text-xs space-y-1.5 text-left min-w-[280px]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">สถานะ:</span>
          <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {isDirect ? 'อนุมัติและพร้อมรับงาน (Active)' : 'รอเจ้าหน้าที่ตรวจสอบ (Pending)'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">ระดับคู่ค้า:</span>
          <span className="font-bold text-slate-800">
            {result.estimatedTier} ({result.score}/100)
          </span>
        </div>
        <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/60">
          {isDirect
            ? 'ข้อมูลคู่ค้าและศูนย์บริการถูกบันทึกลงในระบบเรียบร้อยแล้ว'
            : 'เจ้าหน้าที่ SVC จะติดต่อกลับภายใน 1-2 วันทำการ'}
        </div>
      </div>

      {onFinish && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onFinish}
            className="btn btn-primary text-xs px-5 py-2 inline-flex items-center gap-1.5 font-medium shadow-xs"
          >
            <span>ไปที่หน้ารายชื่อคู่ค้า</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
