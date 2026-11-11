'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { parseVendorApplicationFullDetail } from '@/lib/vendor-application-detail'
import type { RawVendorApplicationRecord, NormalizedVendorApplication } from '@/lib/vendor-application-types'
import {
  ApprovedCredentialsModal,
  type ApprovedCredentials,
  type EmailStatus,
} from '@/components/vendor-setup/ApprovedCredentialsModal'
import { ApplicationStickyHeader } from './ApplicationStickyHeader'
import { Section1CompanyCard } from './Section1CompanyCard'
import { Section2ProductsRatesCard } from './Section2ProductsRatesCard'
import { Section3And4OperationsCard } from './Section3And4OperationsCard'
import { Section5CoverageCard } from './Section5CoverageCard'
import { Section6To9CommercialSafetyCard } from './Section6To9CommercialSafetyCard'
import { Section10DocsConfirmCard } from './Section10DocsConfirmCard'

export default function VendorApplicationFullDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const { toast } = useToast()

  const [app, setApp] = useState<NormalizedVendorApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundErr, setNotFoundErr] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [approved, setApproved] = useState<{
    credentials: ApprovedCredentials
    storeName: string
    emailStatus?: EmailStatus
  } | null>(null)

  const loadDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setNotFoundErr(null)
    try {
      const raw = await api<RawVendorApplicationRecord>(`/api/admin/vendor-applications/${id}`)
      setApp(parseVendorApplicationFullDetail(raw))
    } catch (err) {
      setNotFoundErr(err instanceof Error ? err.message : 'ไม่พบข้อมูลใบสมัครคู่ค้า')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const handleDecision = async (action: 'APPROVE' | 'REJECT' | 'RESYNC') => {
    if (!app) return
    if (action === 'REJECT' && !rejectReason.trim()) {
      toast('กรุณาระบุเหตุผลการปฏิเสธใบสมัคร', 'error')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/vendor-applications/${app.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: rejectReason.trim() }),
      })
      const data = (await res.json()) as {
        error?: string
        credentials?: ApprovedCredentials
        email?: EmailStatus
      }
      if (!res.ok) throw new Error(data.error || 'ดำเนินการไม่สำเร็จ')

      toast(
        action === 'APPROVE'
          ? 'อนุมัติคู่ค้าเข้าระบบเรียบร้อยแล้ว'
          : action === 'RESYNC'
            ? 'ซิงก์ข้อมูลแบรนด์และศูนย์บริการจากใบสมัครเรียบร้อยแล้ว'
            : 'ปฏิเสธใบสมัครเรียบร้อยแล้ว',
        action === 'REJECT' ? 'info' : 'success'
      )
      if (action === 'APPROVE' && data.credentials) {
        setApproved({
          credentials: data.credentials,
          storeName: app.section1.storeName,
          emailStatus: data.email,
        })
      }
      setRejectReason('')
      await loadDetail()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="pcard py-12 text-center text-sm text-slate-500">
        กำลังโหลดข้อมูลใบสมัครคู่ค้าแบบเต็ม (10 หมวด)...
      </div>
    )
  }

  if (notFoundErr || !app) {
    return (
      <div className="pcard py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-rose-600">{notFoundErr || 'ไม่พบข้อมูลใบสมัครคู่ค้า'}</p>
        <Link href="/admin/vendors/applications" className="btn btn-secondary text-xs inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้ารายการใบสมัคร
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-12 print:p-6 print:space-y-4">
      <ApplicationStickyHeader
        app={app}
        busy={busy}
        rejectReason={rejectReason}
        onChangeRejectReason={setRejectReason}
        onDecision={handleDecision}
        onPrint={() => window.print()}
      />

      <Section1CompanyCard s1={app.section1} />
      <Section2ProductsRatesCard s2={app.section2} />
      <Section3And4OperationsCard s3={app.section3} s4={app.section4} />
      <Section5CoverageCard s5={app.section5} />
      <Section6To9CommercialSafetyCard
        s6={app.section6}
        s7={app.section7}
        s8={app.section8}
        s9={app.section9}
      />
      <Section10DocsConfirmCard s10={app.section10} />

      {approved && <ApprovedCredentialsModal {...approved} onClose={() => setApproved(null)} />}
    </div>
  )
}
