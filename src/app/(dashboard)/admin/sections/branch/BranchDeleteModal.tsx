'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import { AlertTriangle, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { SiteDetailItem } from './branch-types'

interface BranchDeleteModalProps {
  site: SiteDetailItem | null
  saving: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function BranchDeleteModal({
  site,
  saving,
  onClose,
  onConfirm,
}: BranchDeleteModalProps) {
  if (!site) return null

  const hasOpenJobs = (site.openJobsCount ?? 0) > 0
  const isDeactivating = site.active

  return (
    <Modal open={Boolean(site)} onClose={onClose}>
      <div className="space-y-4 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              !isDeactivating
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : hasOpenJobs
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          >
            {!isDeactivating ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : hasOpenJobs ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {!isDeactivating
                ? `เปิดใช้งาน ${site.name}`
                : `ปิดการใช้งาน ${site.name} (${site.code})`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {!isDeactivating
                ? 'สาขานี้จะกลับมาให้บริการและสามารถเปิดใบแจ้งซ่อมได้ตามปกติ'
                : 'ตรวจสอบเงื่อนไขความปลอดภัยก่อนระงับการให้บริการ'}
            </p>
          </div>
        </div>

        {/* Safety Alert for Active Jobs */}
        {isDeactivating && hasOpenJobs ? (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>ตรวจพบงานซ่อมที่ยังดำเนินการไม่เสร็จสิ้น!</span>
            </div>
            <p className="text-rose-600 leading-relaxed">
              สาขานี้มีใบแจ้งซ่อมที่ยังเปิดอยู่ <b>{site.openJobsCount} รายการ</b>{' '}
              ระบบไม่อนุญาตให้ปิดการใช้งานสาขาจนกว่างานซ่อมทั้งหมดจะถูกปิดงาน (Closed) หรือยกเลิก (Cancelled)
            </p>
          </div>
        ) : isDeactivating ? (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
            <p className="font-semibold text-slate-700">เงื่อนไข Soft-delete:</p>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>ข้อมูลประวัติใบแจ้งซ่อมและรายงานทั้งหมดจะยังคงอยู่ครบถ้วนในฐานข้อมูล</li>
              <li>สาขานี้จะไม่ปรากฏในหน้าเปิดใบแจ้งซ่อมใหม่ (CS Intake) สำหรับลูกค้า</li>
              <li>ผู้ดูแลระบบสามารถกลับมาเปิดใช้งานสาขานี้ใหม่ได้ทุกเมื่อ</li>
            </ul>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-800">
            ยืนยันการเปิดใช้งานสาขานี้อีกครั้ง เพื่อให้พนักงานสามารถสร้างใบแจ้งซ่อมและเชื่อมโยงเส้นทางจัดส่งได้
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={saving || (isDeactivating && hasOpenJobs)}
            onClick={onConfirm}
            className={`px-4 py-2 font-medium text-white rounded-lg shadow-sm transition-colors ${
              !isDeactivating
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {saving
              ? 'กำลังดำเนินการ...'
              : !isDeactivating
              ? 'ยืนยันเปิดใช้งาน'
              : 'ยืนยันปิดการใช้งานสาขา'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
