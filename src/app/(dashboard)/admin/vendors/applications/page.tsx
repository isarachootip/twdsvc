'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/client'
import { fmtDate, fmtPhone } from '@/lib/constants'
import { useToast } from '@/components/ui/Toast'
import { CheckCircle2, XCircle, Eye, Building2, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ApplicationRow {
  id: string
  applicationNo: string
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  storeName: string
  businessType: string
  phone: string
  estimatedTier: string
  score: number
  signatureUrl: string | null
  createdAt: string
  branches: unknown[]
}

export default function VendorApplicationsPage() {
  const [list, setList] = useState<ApplicationRow[] | null>(null)
  const [selected, setSelected] = useState<ApplicationRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  const load = useCallback(() => {
    api<ApplicationRow[]>('/api/admin/vendor-applications')
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
        <Link href="/vendor/register" target="_blank" className="btn btn-primary text-xs">
          เปิดหน้าสมัคร (Portal)
        </Link>
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
              {list && list.map(app => (
                <tr key={app.id}>
                  <td><b>{app.applicationNo}</b></td>
                  <td>{app.storeName}</td>
                  <td><span className="badge b-gray">{app.businessType}</span></td>
                  <td>{fmtPhone(app.phone)}</td>
                  <td>
                    <span className={`badge ${app.estimatedTier === 'VIP' ? 'b-purple' : app.estimatedTier === 'PRO' ? 'b-amber' : 'b-gray'}`}>
                      {app.estimatedTier}
                    </span>
                  </td>
                  <td><b>{app.score}/100</b></td>
                  <td>{fmtDate(app.createdAt)}</td>
                  <td>
                    <span className={`badge ${app.status === 'APPROVED' ? 'b-green' : app.status === 'REJECTED' ? 'b-red' : 'b-amber'}`}>
                      {app.status === 'APPROVED' ? 'อนุมัติแล้ว' : app.status === 'REJECTED' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
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

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base">ตรวจสอบใบสมัคร: {selected.applicationNo}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div><span className="text-slate-500">ชื่อร้าน:</span> <b>{selected.storeName}</b> ({selected.businessType})</div>
              <div><span className="text-slate-500">เบอร์โทร:</span> <b>{selected.phone}</b></div>
              <div><span className="text-slate-500">ระดับคาดการณ์:</span> <b>{selected.estimatedTier}</b> (คะแนน {selected.score}/100)</div>
              {selected.signatureUrl && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">ลายเซ็นดิจิทัล:</span>
                  <div className="border rounded-lg p-2 bg-slate-50 inline-block">
                    <img src={selected.signatureUrl} alt="Signature" className="h-14 object-contain" />
                  </div>
                </div>
              )}
            </div>

            {selected.status === 'PENDING_APPROVAL' && (
              <div className="space-y-3 pt-3 border-t">
                <input
                  type="text"
                  className="inp text-xs"
                  placeholder="ระบุเหตุผล (กรณีปฏิเสธ)"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    disabled={busy}
                    onClick={() => handleAction(selected.id, 'REJECT')}
                    className="btn btn-secondary text-xs text-red-600 hover:bg-red-50"
                  >
                    ปฏิเสธใบสมัคร
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => handleAction(selected.id, 'APPROVE')}
                    className="btn btn-primary text-xs"
                  >
                    อนุมัติเข้าระบบ (Approve)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
