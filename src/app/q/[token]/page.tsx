'use client'

import { useState, useEffect, use } from 'react'
import { XCircle } from 'lucide-react'
import CustomerSignModal from './CustomerSignModal'
import PublicQuoteA4Modal from './PublicQuoteA4Modal'
import QuoteFinancialCard from './QuoteFinancialCard'
import { QuoteDecisionActions, QuoteJobSummaryCard } from './QuoteJobAndActions'
import { ManagerApprovalSignatureCard, QuoteStatusBanners } from './QuoteStatusBanners'
import { QuotePhotoLightbox, QuoteRejectModal } from './QuoteOverlays'
import type { QuoteActionDone, QuoteData } from './quote-types'

export default function CustomerQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [a4ModalOpen, setA4ModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [activePhoto, setActivePhoto] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState<QuoteActionDone | null>(null)

  const loadQuote = () => {
    fetch(`/api/public/q/${token}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? 'ไม่พบข้อมูลหรือลิงก์หมดอายุ')
        return j
      })
      .then((d: QuoteData) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadQuote()
  }, [token])

  const handleApproveConfirm = async (signatureUrl: string) => {
    if (!data) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/q/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: data.job.version, signatureUrl }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'เกิดข้อผิดพลาดในการอนุมัติ')
      setSignModalOpen(false)
      setActionDone({
        type: 'APPROVED',
        message: 'อนุมัติการซ่อมเรียบร้อยแล้ว ช่างจะเริ่มดำเนินการซ่อมทันที',
        payUrl: result.payUrl || (data.quote.total > 0 ? `/pay/${token}` : null),
      })
      loadQuote()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!data) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/q/${token}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: data.job.version, reason: rejectReason }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'เกิดข้อผิดพลาดในการปฏิเสธ')
      setRejectModalOpen(false)
      setActionDone({
        type: 'REJECTED',
        message: 'บันทึกการปฏิเสธซ่อมเรียบร้อย สินค้าจะถูกจัดส่งกลับไปที่สาขาต้นทาง',
      })
      loadQuote()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#6B6459]">กำลังโหลดข้อมูลใบเสนอราคา...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E4DED2] max-w-sm w-full text-center space-y-3">
          <XCircle size={44} className="text-[#C8102E] mx-auto" />
          <h2 className="font-bold text-[#2B2723] text-base">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
          <p className="text-xs text-[#6B6459] leading-relaxed">{error || 'กรุณาติดต่อสาขาไทวัสดุ หรือโทร 1308'}</p>
        </div>
      </div>
    )
  }

  const { job, quote } = data

  return (
    <div className="min-h-screen bg-[#F3EEE6] font-sans pb-12">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF7F2] shadow-sm flex flex-col justify-between">
        <div>
          <div className="bg-[#C8102E] text-white py-5 px-6 text-center shadow-md">
            <h1 className="text-base font-semibold tracking-wide">ศูนย์บริการซ่อมไทวัสดุ</h1>
            <p className="text-xs opacity-90 mt-0.5 font-light">แจ้งค่าบริการซ่อมสินค้า — ใบเสนอราคา</p>
          </div>

          <div className="p-4 space-y-3.5">
            <QuoteStatusBanners data={data} actionDone={actionDone} />
            <QuoteJobSummaryCard data={data} onSelectPhoto={setActivePhoto} />
            <QuoteFinancialCard data={data} onOpenA4={() => setA4ModalOpen(true)} />
            <ManagerApprovalSignatureCard data={data} />
            <QuoteDecisionActions
              data={data}
              submitting={submitting}
              onApproveClick={() => setSignModalOpen(true)}
              onRejectClick={() => setRejectModalOpen(true)}
            />
          </div>
        </div>

        <div className="text-center text-[11px] text-[#9A9384] py-4 border-t border-[#E4DED2] bg-[#FAF7F2]">
          หากต้องการสอบถามเพิ่มเติม สามารถติดต่อได้ที่ 1308 ในเวลาทำการ (07:00 – 20:00 น.)
        </div>
      </div>

      <QuoteRejectModal
        open={rejectModalOpen}
        branchName={job.branchName}
        rejectReason={rejectReason}
        onChangeReason={setRejectReason}
        onConfirm={handleReject}
        onClose={() => setRejectModalOpen(false)}
        submitting={submitting}
      />
      <QuotePhotoLightbox photoUrl={activePhoto} onClose={() => setActivePhoto(null)} />
      <CustomerSignModal
        open={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        onConfirm={handleApproveConfirm}
        submitting={submitting}
        quoteNo={quote.quoteNo}
        totalBaht={quote.total}
      />
      <PublicQuoteA4Modal
        open={a4ModalOpen}
        onClose={() => setA4ModalOpen(false)}
        data={{
          ...quote,
          jobNo: job.jobNo,
          customer: job.customerName ?? null,
          product: job.productName,
          brandName: job.brandName,
          serialNo: job.serialNo,
          hasWarranty: job.hasWarranty,
          shippingMethod: job.shippingMethod,
          symptom: job.symptom,
          branchName: job.branchName,
          storeManagerName: job.storeManagerName,
          vendorLabel: job.vendorName,
          openedAt: job.openedAt,
          operationFeePaid: job.operationFeePaid,
          quoteUrl: `/q/${token}`,
          lines: quote.lines.map((l) => ({
            type: l.type,
            description: l.description,
            quantity: l.quantity,
            amount: l.unitPrice * l.quantity,
            partWaitDays: l.partWaitDays,
            partWarrantyDays: l.partWarrantyDays,
          })),
        }}
      />
    </div>
  )
}
