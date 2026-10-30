'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/client'
import { fmtDate, fmtPhone } from '@/lib/constants'
import { useToast } from '@/components/ui/Toast'
import { Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CopyRegisterLinkButton } from '@/components/vendor-setup/CopyRegisterLinkButton'
import {
  ApprovedCredentialsModal,
  type ApprovedCredentials,
  type EmailStatus,
} from '@/components/vendor-setup/ApprovedCredentialsModal'
import {
  ApplicationReviewModal,
  type VendorApplicationDetail,
} from './ApplicationReviewModal'

export default function VendorApplicationsPage() {
  const [list, setList] = useState<VendorApplicationDetail[] | null>(null)
  const [selected, setSelected] = useState<VendorApplicationDetail | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [approved, setApproved] = useState<{
    credentials: ApprovedCredentials
    storeName: string
    emailStatus?: EmailStatus
  } | null>(null)
  const { toast } = useToast()

  const load = useCallback(() => {
    api<VendorApplicationDetail[]>('/api/admin/vendor-applications')
      .then(setList)
      .catch(() => setList([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/vendor-applications/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ดำเนินการไม่สำเร็จ')
      toast(
        action === 'APPROVE' ? 'อนุมัติคู่ค้าสำเร็จ' : 'ปฏิเสธใบสมัครแล้ว',
        action === 'APPROVE' ? 'success' : 'info'
      )
      if (action === 'APPROVE' && data.credentials) {
        setApproved({
          credentials: data.credentials,
          storeName: selected?.storeName ?? '',
          emailStatus: data.email,
        })
      }
      setSelected(null)
      setRejectReason('')
      load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/vendor" className="btn btn-secondary text-xs flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าตั้งค่า Vendor
          </Link>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            ใบสมัครคู่ค้าใหม่ (Vendor Applications)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <CopyRegisterLinkButton />
          <Link href="/vendor/register" target="_blank" className="btn btn-primary text-xs">
            เปิดหน้าสมัคร (Portal)
          </Link>
        </div>
      </div>

      <div className="pcard">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead>
              <tr>
                <th>เลขที่ใบสมัคร</th>
                <th>ชื่อร้าน / บริษัท</th>
                <th>ประเภท</th>
                <th>เบอร์โทร</th>
                <th>ระดับ (Tier)</th>
                <th>คะแนน</th>
                <th>วันที่ส่ง</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(!list || list.length === 0) && (
                <tr>
                  <td colSpan={9} className="empty text-center py-6">
                    {!list ? 'กำลังโหลดข้อมูล...' : 'ยังไม่มีใบสมัครคู่ค้าใหม่'}
                  </td>
                </tr>
              )}
              {list &&
                list.map(app => (
                  <tr key={app.id}>
                    <td>
                      <b className="font-mono">{app.applicationNo}</b>
                    </td>
                    <td>{app.storeName}</td>
                    <td>
                      <span className="text-xs font-medium text-slate-600">{app.businessType}</span>
                    </td>
                    <td>{fmtPhone(app.phone)}</td>
                    <td>
                      <span
                        className={`text-xs font-semibold ${
                          app.estimatedTier === 'VIP'
                            ? 'text-purple-700'
                            : app.estimatedTier === 'PRO'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                        }`}
                      >
                        {app.estimatedTier}
                      </span>
                    </td>
                    <td>
                      <b>{app.score}/100</b>
                    </td>
                    <td>{fmtDate(app.createdAt)}</td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          app.status === 'APPROVED'
                            ? 'text-emerald-700'
                            : app.status === 'REJECTED'
                              ? 'text-rose-600'
                              : 'text-amber-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            app.status === 'APPROVED'
                              ? 'bg-emerald-500'
                              : app.status === 'REJECTED'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                          }`}
                        />
                        {app.status === 'APPROVED'
                          ? 'อนุมัติแล้ว'
                          : app.status === 'REJECTED'
                            ? 'ปฏิเสธ'
                            : 'รอตรวจสอบ'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelected(app)}
                        className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> ตรวจสอบ
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <ApplicationReviewModal
        application={selected}
        busy={busy}
        rejectReason={rejectReason}
        onChangeRejectReason={setRejectReason}
        onDecision={handleAction}
        onClose={() => setSelected(null)}
      />

      {approved && <ApprovedCredentialsModal {...approved} onClose={() => setApproved(null)} />}
    </div>
  )
}
