'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck,
  ImageIcon, Wrench, ChevronRight, X, ExternalLink
} from 'lucide-react'

interface QuoteLine {
  type: string
  description: string
  unitPrice: number
  quantity: number
  partWaitDays?: number
  partWarrantyDays?: number
}

interface QuoteData {
  job: {
    id: string
    jobNo: string
    productName: string
    brandName: string
    branchName: string
    branchPhone?: string | null
    vendorName?: string | null
    customerName?: string | null
    hasWarranty: boolean
    version: number
    stage: string
  }
  quote: {
    quoteNo: string
    version: number
    subtotal: number
    vatAmount: number
    total: number
    repairDays: number
    repairWarrantyDays: number
    vendorNote?: string | null
    expiresAt?: string | null
    lines: QuoteLine[]
  }
  photos: string[]
  payUrl?: string | null
  token: string
  expired: boolean
  decided: boolean
  decision?: string
}

function formatSatang(satang: number | null | undefined): string {
  if (satang === null || satang === undefined) return '฿0.00'
  const baht = satang / 100
  return `฿${baht.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CustomerQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [activePhoto, setActivePhoto] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState<{
    type: 'APPROVED' | 'REJECTED'
    message: string
    payUrl?: string | null
  } | null>(null)

  const loadQuote = () => {
    fetch(`/api/public/q/${token}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? 'ไม่พบข้อมูลหรือลิงก์หมดอายุ')
        return j
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadQuote()
  }, [token])

  const handleApprove = async () => {
    if (!data) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/q/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: data.job.version }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'เกิดข้อผิดพลาดในการอนุมัติ')

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
        message: 'บันทึกการไม่อนุมัติเรียบร้อย สินค้าจะถูกจัดส่งกลับไปที่สาขาต้นทาง',
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
          <p className="text-xs text-[#6B6459] leading-relaxed">{error || 'กรุณาติดต่อสาขาไทวัสดุที่เปิดใบแจ้งซ่อม'}</p>
        </div>
      </div>
    )
  }

  const { job, quote } = data
  const isApproved = data.decided && data.decision === 'APPROVED'
  const isRejected = data.decided && data.decision === 'REJECTED'

  return (
    <div className="min-h-screen bg-[#F3EEE6] font-sans pb-12">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF7F2] shadow-sm flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="bg-[#C8102E] text-white py-5 px-6 text-center shadow-md">
            <h1 className="text-base font-semibold tracking-wide">ศูนย์บริการซ่อมไทวัสดุ</h1>
            <p className="text-xs opacity-90 mt-0.5 font-light">Thaiwatsadu Service Center — ใบเสนอราคาซ่อม</p>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Status Feedback Banner if just actioned */}
            {actionDone && (
              <div
                className={`p-4 rounded-2xl text-center space-y-2 shadow-sm border ${
                  actionDone.type === 'APPROVED'
                    ? 'bg-[#E1F5EE] border-[#1D9E75] text-[#1D9E75]'
                    : 'bg-[#FBE7E9] border-[#C8102E] text-[#9C0C22]'
                }`}
              >
                {actionDone.type === 'APPROVED' ? (
                  <CheckCircle2 size={36} className="mx-auto" />
                ) : (
                  <XCircle size={36} className="mx-auto" />
                )}
                <h3 className="font-bold text-sm">
                  {actionDone.type === 'APPROVED' ? 'อนุมัติการซ่อมสำเร็จ' : 'บันทึกไม่อนุมัติการซ่อมแล้ว'}
                </h3>
                <p className="text-xs leading-relaxed opacity-90">{actionDone.message}</p>
                {actionDone.payUrl && (
                  <Link
                    href={actionDone.payUrl}
                    className="inline-block mt-2 w-full py-2.5 rounded-xl bg-[#C8102E] text-white font-bold text-xs shadow hover:opacity-95"
                  >
                    ไปหน้าชำระเงินทันที ↗
                  </Link>
                )}
              </div>
            )}

            {/* Existing decided status banners */}
            {!actionDone && isApproved && (
              <div className="bg-[#E1F5EE] border border-[#1D9E75] p-3.5 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={24} className="text-[#1D9E75] shrink-0" />
                <div className="text-xs text-[#2B2723]">
                  <span className="font-bold text-[#1D9E75] block">ท่านได้อนุมัติการซ่อมแล้ว</span>
                  งานซ่อมกำลังดำเนินการ หรืออยู่ระหว่างรอชำระค่าบริการ
                </div>
              </div>
            )}
            {!actionDone && isRejected && (
              <div className="bg-[#FBE7E9] border border-[#C8102E] p-3.5 rounded-2xl flex items-center gap-3">
                <XCircle size={24} className="text-[#C8102E] shrink-0" />
                <div className="text-xs text-[#2B2723]">
                  <span className="font-bold text-[#9C0C22] block">ท่านได้ปฏิเสธการซ่อมแล้ว</span>
                  สินค้าอยู่ระหว่างเตรียมจัดส่งคืนสาขาต้นทาง
                </div>
              </div>
            )}

            {/* Job Information Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-[#E4DED2] pb-2">
                <span className="text-[#6B6459]">เลขที่ใบแจ้งซ่อม</span>
                <span className="font-bold text-[#2B2723] font-mono text-sm">{job.jobNo}</span>
              </div>
              <div className="flex justify-between border-b border-[#E4DED2] pb-2">
                <span className="text-[#6B6459]">สินค้า</span>
                <span className="font-medium text-[#2B2723] text-right">{job.productName} ({job.brandName})</span>
              </div>
              <div className="flex justify-between border-b border-[#E4DED2] pb-2">
                <span className="text-[#6B6459]">ศูนย์บริการ</span>
                <span className="text-[#2B2723]">{job.vendorName || 'ศูนย์บริการมาตรฐานไทวัสดุ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6459]">สาขาที่ส่งเครื่อง</span>
                <span className="text-[#2B2723]">{job.branchName}</span>
              </div>
            </div>

            {/* Photo Gallery (Triage / Inspection photos) */}
            {data.photos && data.photos.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2723]">
                  <ImageIcon size={15} className="text-[#C8102E]" />
                  <span>ภาพถ่ายตรวจสภาพสินค้า ({data.photos.length} รูป)</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                  {data.photos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhoto(photoUrl)}
                      className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-[#D2C9B8] hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={photoUrl}
                        alt={`ภาพตรวจสภาพ ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#9A9384] text-center">แตะรูปเพื่อดูภาพขยายเต็มจอ</p>
              </div>
            )}

            {/* Line Items Breakdown Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
              <h3 className="font-bold text-xs text-[#2B2723] border-b border-[#E4DED2] pb-2">
                รายการค่าใช้จ่าย (เลขที่ใบเสนอราคา: {quote.quoteNo})
              </h3>
              <div className="space-y-2.5 text-xs">
                {quote.lines.map((line, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-[#F3EEE6] pb-2">
                    <div className="pr-2">
                      <div className="font-medium text-[#2B2723]">
                        {line.description}
                        {line.quantity > 1 && <span className="text-[#6B6459] ml-1">× {line.quantity}</span>}
                      </div>
                      {line.partWaitDays ? (
                        <div className="text-[10px] text-[#BA7517] flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> รอสั่งอะไหล่ {line.partWaitDays} วัน
                        </div>
                      ) : null}
                    </div>
                    <div className="font-mono font-semibold text-[#2B2723] whitespace-nowrap">
                      {formatSatang(line.unitPrice * line.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Calculation */}
              <div className="space-y-1.5 pt-1 text-xs border-t border-[#E4DED2]">
                <div className="flex justify-between text-[#6B6459]">
                  <span>รวมก่อน VAT</span>
                  <span className="font-mono">{formatSatang(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6B6459]">
                  <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                  <span className="font-mono">{formatSatang(quote.vatAmount)}</span>
                </div>
              </div>

              {/* Total Net Amount Box */}
              <div className="bg-[#FBE7E9] rounded-xl p-3.5 text-center mt-2">
                <p className="text-xs text-[#9C0C22] mb-0.5 font-medium">ยอดที่ต้องชำระทั้งหมด</p>
                <p className="text-2xl font-bold text-[#9C0C22] font-mono">{formatSatang(quote.total)}</p>
              </div>
            </div>

            {/* Repair Info Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
              <div className="flex justify-between border-b border-[#E4DED2] pb-2">
                <span className="text-[#6B6459]">ระยะเวลาซ่อมโดยประมาณ</span>
                <span className="font-semibold text-[#2B2723]">{quote.repairDays} วันทำการ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6459]">รับประกันงานซ่อม</span>
                <span className="font-semibold text-[#1D9E75]">{quote.repairWarrantyDays} วัน</span>
              </div>
              {quote.vendorNote && (
                <div className="mt-2 pt-2 border-t border-[#E4DED2] text-[11px] text-[#6B6459]">
                  <span className="font-medium text-[#2B2723]">หมายเหตุจากช่าง:</span> {quote.vendorNote}
                </div>
              )}
            </div>

            {/* Action Buttons or Pay Link */}
            {!data.decided && !data.expired && (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm shadow hover:bg-[#9C0C22] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  {submitting ? 'กำลังบันทึก...' : 'อนุมัติการซ่อม'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-white text-[#6B6459] border border-[#D2C9B8] font-medium text-sm hover:bg-[#F3EEE6] transition-colors disabled:opacity-60"
                >
                  ไม่อนุมัติซ่อม (ขอรับสินค้าคืน)
                </button>
              </div>
            )}

            {/* If already approved and payUrl is present */}
            {data.decided && data.decision === 'APPROVED' && data.payUrl && (
              <Link
                href={data.payUrl}
                className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm shadow hover:bg-[#9C0C22] transition-colors flex items-center justify-center gap-2 text-center"
              >
                ชำระค่าซ่อมออนไลน์ ({formatSatang(quote.total)}) <ChevronRight size={18} />
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-[#9A9384] py-4 border-t border-[#E4DED2] bg-[#FAF7F2]">
          หากมีข้อสงสัย ติดต่อศูนย์บริการสาขา {job.branchName}
          {job.branchPhone && ` โทร. ${job.branchPhone}`}
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-[#E4DED2]">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#FBE7E9] text-[#C8102E] flex items-center justify-center mx-auto">
                <AlertCircle size={28} />
              </div>
              <h3 className="font-bold text-base text-[#2B2723]">ยืนยันไม่อนุมัติการซ่อม?</h3>
              <p className="text-xs text-[#6B6459] leading-relaxed">
                ค่าดำเนินการตรวจเช็คที่ชำระไว้ตอนเปิดงานจะไม่สามารถขอคืนได้ และสินค้าจะถูกจัดส่งกลับไปยังสาขา {job.branchName} เพื่อให้ท่านมารับคืน
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#6B6459]">เหตุผลที่ไม่อนุมัติ (ไม่บังคับ)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น ราคาซ่อมสูงเกินไป, เปลี่ยนใจซื้อใหม่..."
                rows={2}
                className="w-full p-2.5 border border-[#D2C9B8] rounded-xl text-xs outline-none focus:border-[#C8102E]"
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold text-xs hover:bg-[#9C0C22] transition-colors disabled:opacity-60"
              >
                {submitting ? 'กำลังบันทึก...' : 'ยืนยันไม่อนุมัติซ่อม'}
              </button>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl text-[#6B6459] text-xs hover:bg-gray-100 transition-colors"
              >
                ยกเลิก (กลับไปดูใบเสนอราคา)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo Gallery */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute -top-10 right-0 text-white hover:opacity-80 p-1"
            >
              <X size={24} />
            </button>
            <img
              src={activePhoto}
              alt="ภาพขยาย"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl shadow-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  )
}
