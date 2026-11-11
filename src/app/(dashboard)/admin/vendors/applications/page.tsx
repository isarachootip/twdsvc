'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/client'
import { fmtDate, fmtPhone } from '@/lib/constants'
import { Eye, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { CopyRegisterLinkButton } from '@/components/vendor-setup/CopyRegisterLinkButton'
import type { ApplicationStatusType } from '@/lib/vendor-application-types'

interface VendorApplicationListItem {
  id: string
  applicationNo: string
  status: ApplicationStatusType
  storeName: string
  businessType: string
  phone: string
  estimatedTier: string
  score: number
  createdAt: string
}

export default function VendorApplicationsPage() {
  const [list, setList] = useState<VendorApplicationListItem[] | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)
  const { toast } = useToast()

  const load = useCallback(() => {
    api<VendorApplicationListItem[]>('/api/admin/vendor-applications')
      .then(setList)
      .catch(() => setList([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleResyncAll = async () => {
    setSyncingAll(true)
    try {
      const res = await api<{ ok: boolean; syncedCount: number }>('/api/admin/vendor-applications', {
        method: 'PATCH',
      })
      toast(`ซิงก์ข้อมูลคู่ค้าที่อนุมัติแล้วสำเร็จ (${res.syncedCount} รายการ)`, 'success')
      load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'ซิงก์ข้อมูลไม่สำเร็จ', 'error')
    } finally {
      setSyncingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/vendor" className="btn btn-secondary text-xs flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าตั้งค่า Vendor
          </Link>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            ใบสมัครคู่ค้าใหม่ (Vendor Applications)
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={syncingAll}
            onClick={handleResyncAll}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            <span>ซิงก์ใบสมัครที่อนุมัติแล้วทั้งหมด</span>
          </button>
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
                      <Link
                        href={`/admin/vendors/applications/${app.id}`}
                        className="font-mono font-bold text-red-700 hover:underline"
                      >
                        {app.applicationNo}
                      </Link>
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
                      <Link
                        href={`/admin/vendors/applications/${app.id}`}
                        className="btn btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> ตรวจสอบ
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
