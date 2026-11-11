'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { fmtDateTime } from '@/lib/constants'
import type { NormalizedVendorApplication } from '@/lib/vendor-application-types'

interface ApplicationStickyHeaderProps {
  app: NormalizedVendorApplication
  busy: boolean
  rejectReason: string
  onChangeRejectReason: (val: string) => void
  onDecision: (action: 'APPROVE' | 'REJECT' | 'RESYNC') => void
  onPrint: () => void
}

export function ApplicationStickyHeader({
  app,
  busy,
  rejectReason,
  onChangeRejectReason,
  onDecision,
  onPrint,
}: ApplicationStickyHeaderProps) {
  const statusColor =
    app.status === 'APPROVED'
      ? 'text-emerald-700'
      : app.status === 'REJECTED'
        ? 'text-rose-600'
        : 'text-amber-700'
  const dotColor =
    app.status === 'APPROVED'
      ? 'bg-emerald-500'
      : app.status === 'REJECTED'
        ? 'bg-rose-500'
        : 'bg-amber-500'
  const statusLabel =
    app.status === 'APPROVED'
      ? 'อนุมัติแล้ว'
      : app.status === 'REJECTED'
        ? 'ปฏิเสธใบสมัคร'
        : 'รอตรวจสอบ'

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 -mx-4 px-4 py-3 sm:mx-0 sm:rounded-xl sm:border shadow-xs space-y-3 print:static print:border-b print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/vendors/applications"
            className="btn btn-secondary text-xs flex items-center gap-1 no-print"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้ารายการใบสมัคร
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                ใบสมัครคู่ค้า <span className="font-mono text-red-700">{app.applicationNo}</span>
              </h2>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${statusColor}`}>
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {app.section1.storeName} ({app.section1.entityType}) • ระดับคาดการณ์{' '}
              <b className="text-slate-800">{app.estimatedTier}</b> ({app.score}/100 คะแนน) • ส่งเมื่อ{' '}
              {fmtDateTime(app.createdAt)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onPrint}
          className="btn btn-secondary text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="w-3.5 h-3.5" /> พิมพ์ใบสมัคร
        </button>
      </div>

      {app.status === 'PENDING_APPROVAL' ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100 no-print">
          <input
            type="text"
            className="inp text-xs flex-1"
            placeholder="ระบุเหตุผลประกอบ (จำเป็นต้องกรอกกรณีปฏิเสธใบสมัคร)"
            value={rejectReason}
            onChange={e => onChangeRejectReason(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecision('REJECT')}
              className="btn btn-secondary text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" /> ปฏิเสธใบสมัคร
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecision('APPROVE')}
              className="btn btn-primary text-xs flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติเข้าระบบ (Approve)
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <div>
              <span className="text-slate-500">ผู้พิจารณา:</span>{' '}
              <b className="text-slate-800">{app.reviewerName || app.reviewedBy || '-'}</b>
            </div>
            <div>
              <span className="text-slate-500">วัน-เวลาที่พิจารณา:</span>{' '}
              <b className="text-slate-800">{app.reviewedAt ? fmtDateTime(app.reviewedAt) : '-'}</b>
            </div>
            {app.adminNotes && (
              <div>
                <span className="text-slate-500">เหตุผล / บันทึกผู้ตรวจ:</span>{' '}
                <span className="font-semibold text-rose-600">{app.adminNotes}</span>
              </div>
            )}
          </div>
          {app.status === 'APPROVED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecision('RESYNC')}
              className="btn btn-secondary text-xs flex items-center gap-1.5 no-print"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
              <span>ซิงก์ข้อมูลเข้าคู่ค้าอีกครั้ง (Re-sync)</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
