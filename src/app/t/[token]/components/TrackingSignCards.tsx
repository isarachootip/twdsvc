'use client'

import React, { useState } from 'react'
import { CheckCircle2, FileSignature } from 'lucide-react'
import CsCustomerSignModal from '@/components/jobs/CsCustomerSignModal'
import type { Stage } from '@/lib/constants'

interface TrackingSignCardsProps {
  token: string
  stage: Stage
  intakeSignatureUrl?: string | null
  pickupSignatureUrl?: string | null
  customerName: string | null
  jobNo: string
  onSigned: () => void
}

export default function TrackingSignCards({
  token,
  stage,
  intakeSignatureUrl,
  pickupSignatureUrl,
  customerName,
  jobNo,
  onSigned,
}: TrackingSignCardsProps) {
  const [modalType, setModalType] = useState<'INTAKE' | 'PICKUP' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPickupStage = ['READY_FOR_PICKUP', 'CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED'].includes(stage)
  const needIntakeSign = !intakeSignatureUrl
  const needPickupSign = isPickupStage && !pickupSignatureUrl

  if (!needIntakeSign && !needPickupSign && !intakeSignatureUrl && !pickupSignatureUrl) {
    return null
  }

  const handleSignConfirm = async (signatureUrl: string) => {
    if (!modalType || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/public/t/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: modalType,
          signatureUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'ไม่สามารถบันทึกลายมือชื่อได้')
      }
      setModalType(null)
      onSigned()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* 1. Intake Sign Card (Waiting Signature) */}
      {needIntakeSign && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2.5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
              <FileSignature size={17} className="text-amber-700" />
              ลงนามรับทราบเงื่อนไขการส่งซ่อม (Intake)
            </div>
            <span className="text-amber-700 font-medium inline-flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              รอลงนาม
            </span>
          </div>
          <p className="text-[11.5px] text-slate-600 leading-relaxed">
            ท่านยังไม่ได้ลงนามรับทราบการส่งซ่อม กรุณาลงนามออนไลน์เพื่อยืนยันอาการเสียและเงื่อนไขเบื้องต้น
          </p>
          <button
            type="button"
            onClick={() => setModalType('INTAKE')}
            className="w-full py-2.5 rounded-xl bg-amber-700 text-white font-medium text-xs hover:bg-amber-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            ✍️ กดเพื่อลงนามรับทราบการส่งซ่อม
          </button>
        </div>
      )}

      {/* 2. Pickup Sign Card (Waiting Signature) */}
      {needPickupSign && (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
              <CheckCircle2 size={17} className="text-emerald-700" />
              ลงนามตรวจรับสินค้าคืน (Pickup)
            </div>
            <span className="text-emerald-700 font-medium inline-flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              พร้อมส่งมอบ
            </span>
          </div>
          <p className="text-[11.5px] text-slate-600 leading-relaxed">
            สินค้าซ่อมเสร็จพร้อมส่งมอบแล้ว กรุณาลงนามออนไลน์เพื่อยืนยันการรับสินค้าคืน
          </p>
          <button
            type="button"
            onClick={() => setModalType('PICKUP')}
            className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-medium text-xs hover:bg-emerald-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            ✍️ กดเพื่อลงนามตรวจรับสินค้า
          </button>
        </div>
      )}

      {/* 3. Already Signed Showcase */}
      {(intakeSignatureUrl || pickupSignatureUrl) && (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            หลักฐานการลงนามออนไลน์
          </span>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {intakeSignatureUrl && (
              <div className="border border-slate-100 rounded-xl p-2.5 text-center bg-slate-50/50">
                <div className="text-[10.5px] text-emerald-700 font-medium flex items-center justify-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  ลงนามตอนเปิดงานแล้ว
                </div>
                <img
                  src={intakeSignatureUrl}
                  alt="Intake Signature"
                  className="h-10 mx-auto object-contain"
                />
              </div>
            )}
            {pickupSignatureUrl && (
              <div className="border border-slate-100 rounded-xl p-2.5 text-center bg-slate-50/50">
                <div className="text-[10.5px] text-emerald-700 font-medium flex items-center justify-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  ลงนามรับสินค้าคืนแล้ว
                </div>
                <img
                  src={pickupSignatureUrl}
                  alt="Pickup Signature"
                  className="h-10 mx-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 font-medium text-center">{error}</p>
      )}

      {/* Signature Modal */}
      <CsCustomerSignModal
        open={modalType !== null}
        onClose={() => setModalType(null)}
        title={
          modalType === 'INTAKE'
            ? `ลงนามรับทราบการส่งซ่อม — ${jobNo}`
            : `ลงนามตรวจรับสินค้าคืน — ${jobNo}`
        }
        subtitle={`ลูกค้า: ${customerName ?? 'ลูกค้า'}`}
        disclaimer={
          modalType === 'INTAKE'
            ? 'ข้าพเจ้าได้ส่งมอบสินค้าเพื่อส่งซ่อมตามรายการ และรับทราบเงื่อนไขและค่าใช้จ่ายเบื้องต้นแล้ว'
            : 'ข้าพเจ้าได้ตรวจรับสินค้าซ่อมเรียบร้อยแล้ว ถูกต้องครบถ้วนและอยู่ในสภาพสมบูรณ์'
        }
        submitting={submitting}
        onConfirm={handleSignConfirm}
      />
    </div>
  )
}
