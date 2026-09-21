'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  Package, Clock, CheckCircle2, ChevronRight,
  Phone, AlertCircle, Wrench, ShieldCheck,
  ChevronDown, ChevronUp, Star, CreditCard
} from 'lucide-react'
import { STAGE_ORDER, STAGE_LABELS, Stage } from '@/lib/constants'
import { formatSatang } from '@/lib/fees'

interface TrackingEvent {
  type: string
  fromStage: string | null
  toStage: string | null
  note: string | null
  createdAt: string
}

interface TrackingData {
  jobNo: string
  productName: string
  brandName: string
  customerName: string | null
  customerPhone: string | null
  stage: Stage
  symptom: string
  hasWarranty: boolean
  openedAt: string
  estimatedCompletionDate: string
  branchName: string
  branchPhone: string | null
  events: TrackingEvent[]
  balance: number
  payUrl?: string | null
  csatUrl?: string | null
  activeQuote: {
    quoteNo: string
    status: string
    total: number
    repairDays?: number
    quoteUrl: string | null
  } | null
}

const CUSTOMER_MILESTONES = [
  { id: 1, label: 'รับเรื่องแจ้งซ่อม (Intake)', stages: ['PENDING_VENDOR_ASSIGNMENT', 'CS_OPENED', 'GR_RECEIVED', 'GR_PACKED'] },
  { id: 2, label: 'ส่งซ่อม (Logistics to VD)', stages: ['OUTBOUND_TO_DC', 'AT_DC_OUTBOUND', 'OUTBOUND_TO_VD'] },
  { id: 3, label: 'ประเมินราคา (Quote & Approval)', stages: ['VD_INSPECTING', 'WAITING_APPROVAL'] },
  { id: 4, label: 'กำลังซ่อม (Repair & QA)', stages: ['REPAIRING', 'RETURN_PACKING', 'INBOUND_TO_DC', 'AT_DC_INBOUND', 'INBOUND_TO_BRANCH', 'GR_RETURN_RECEIVED'] },
  { id: 5, label: 'พร้อมรับสินค้า (Ready for collection)', stages: ['READY_FOR_PICKUP', 'CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED'] },
]

export default function PublicTrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAll19Stages, setShowAll19Stages] = useState(false)

  useEffect(() => {
    fetch(`/api/public/t/${token}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? 'ไม่พบข้อมูลการติดตาม หรือลิงก์หมดอายุ')
        return j
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#6B6459]">กำลังค้นหาข้อมูลการส่งซ่อม...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E4DED2] max-w-sm w-full text-center space-y-3">
          <AlertCircle size={44} className="text-[#C8102E] mx-auto" />
          <h2 className="font-bold text-[#2B2723] text-base">ไม่พบข้อมูลการติดตาม</h2>
          <p className="text-xs text-[#6B6459]">{error || 'ลิงก์อาจไม่ถูกต้องหรือหมดอายุ'}</p>
        </div>
      </div>
    )
  }

  const currentStageIndex = STAGE_ORDER.indexOf(data.stage)
  const currentStageLabel = STAGE_LABELS[data.stage] || data.stage

  // Determine current customer milestone (1 to 5)
  let currentMilestoneId = 1
  for (const m of CUSTOMER_MILESTONES) {
    if (m.stages.includes(data.stage)) {
      currentMilestoneId = m.id
      break
    }
  }
  if (['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED'].includes(data.stage)) {
    currentMilestoneId = 5
  }

  return (
    <div className="min-h-screen bg-[#F3EEE6] font-sans pb-12">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF7F2] shadow-sm flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="bg-[#C8102E] text-white py-5 px-6 text-center shadow-md">
            <h1 className="text-base font-semibold tracking-wide">ศูนย์บริการซ่อมไทวัสดุ</h1>
            <p className="text-xs opacity-90 mt-0.5 font-light">ติดตามสถานะงานซ่อม — {data.jobNo}</p>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Urgent Action Banner: Quote Waiting */}
            {data.stage === 'WAITING_APPROVAL' && data.activeQuote && (
              <div className="bg-[#FBE7E9] border-2 border-[#C8102E] p-4 rounded-2xl text-center space-y-2 shadow-sm">
                <span className="text-xs font-bold text-[#9C0C22] uppercase tracking-wide">
                  ⚡ ใบเสนอราคาซ่อมพร้อมให้ท่านตรวจสอบแล้ว
                </span>
                <p className="text-sm font-semibold text-[#2B2723]">
                  ยอดค่าซ่อมรวม <b>{formatSatang(data.activeQuote.total)}</b>
                </p>
                {data.activeQuote.quoteUrl && (
                  <Link
                    href={data.activeQuote.quoteUrl}
                    className="block w-full py-2.5 rounded-xl bg-[#C8102E] text-white font-bold text-xs shadow hover:bg-[#9C0C22] transition-colors"
                  >
                    ดูใบเสนอราคาและกดอนุมัติ ↗
                  </Link>
                )}
              </div>
            )}

            {/* Payment banner if balance > 0 */}
            {data.balance > 0 && data.payUrl && data.stage !== 'WAITING_APPROVAL' && (
              <div className="bg-[#FAEEDA] border border-[#BA7517] p-4 rounded-2xl text-center space-y-2 shadow-sm">
                <div className="text-xs font-bold text-[#BA7517]">มียอดค่าบริการค้างชำระ</div>
                <p className="text-base font-bold text-[#2B2723] font-mono">{formatSatang(data.balance)}</p>
                <Link
                  href={data.payUrl}
                  className="block w-full py-2.5 rounded-xl bg-[#1D9E75] text-white font-bold text-xs shadow hover:opacity-95"
                >
                  ชำระเงินออนไลน์ทันที ↗
                </Link>
              </div>
            )}

            {/* CSAT Survey banner if closed */}
            {data.csatUrl && (
              <div className="bg-[#E1F5EE] border border-[#1D9E75] p-4 rounded-2xl text-center space-y-2 shadow-sm">
                <div className="flex items-center justify-center gap-1 text-[#1D9E75] text-xs font-bold">
                  <Star size={16} fill="currentColor" /> ประเมินความพึงพอใจ
                </div>
                <p className="text-xs text-[#2B2723]">งานซ่อมเสร็จสิ้นแล้ว ช่วยประเมินบริการให้เราหน่อยนะคะ</p>
                <Link
                  href={data.csatUrl}
                  className="block w-full py-2.5 rounded-xl bg-[#1D9E75] text-white font-bold text-xs shadow hover:opacity-95"
                >
                  ให้คะแนนบริการ (CSAT) ★★★★★
                </Link>
              </div>
            )}

            {/* Current Stage Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-[11px] text-[#9A9384]">สถานะปัจจุบัน</div>
                  <h2 className="text-sm font-bold text-[#2B2723]">{currentStageLabel}</h2>
                </div>
              </div>

              {/* 5 Customer Milestones Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] font-medium text-[#6B6459] mb-1.5">
                  <span>รับเรื่อง</span>
                  <span>ส่งซ่อม</span>
                  <span>ประเมิน</span>
                  <span>ซ่อม</span>
                  <span>รับสินค้า</span>
                </div>
                <div className="w-full bg-[#E4DED2] h-2.5 rounded-full overflow-hidden flex">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 border-r border-white last:border-0 ${
                        currentMilestoneId >= step ? 'bg-[#C8102E]' : 'bg-[#E4DED2]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Product & Branch Info Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
              <h3 className="font-bold text-xs text-[#2B2723] border-b border-[#E4DED2] pb-2">
                รายละเอียดงานแจ้งซ่อม
              </h3>
              <div className="flex justify-between">
                <span className="text-[#6B6459]">เลขที่งาน:</span>
                <span className="font-mono font-bold text-[#2B2723]">{data.jobNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6459]">สินค้า:</span>
                <span className="font-semibold text-[#2B2723]">{data.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6459]">แบรนด์:</span>
                <span>{data.brandName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6459]">อาการเสีย:</span>
                <span className="font-medium text-[#2B2723] text-right">{data.symptom || '-'}</span>
              </div>
              {data.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-[#6B6459]">เบอร์โทรติดต่อ:</span>
                  <span className="font-mono text-[#2B2723]">{data.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#E4DED2] pt-2">
                <span className="text-[#6B6459]">กำหนดแล้วเสร็จโดยประมาณ:</span>
                <span className="font-semibold text-[#1D9E75]">
                  {new Date(data.estimatedCompletionDate).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6459]">สาขาที่รับเครื่อง:</span>
                <span className="font-medium text-[#2B2723]">{data.branchName}</span>
              </div>
              {data.branchPhone && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#6B6459]">เบอร์ติดต่อสาขา:</span>
                  <a href={`tel:${data.branchPhone}`} className="text-[#185FA5] font-semibold flex items-center gap-1">
                    <Phone size={12} /> {data.branchPhone}
                  </a>
                </div>
              )}
            </div>

            {/* 19-Stage Detailed Visual Milestone Stepper */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-[#2B2723]">ขั้นตอนการซ่อมทั้งหมด (19 ขั้นตอน)</h3>
                <button
                  type="button"
                  onClick={() => setShowAll19Stages(!showAll19Stages)}
                  className="text-xs text-[#C8102E] font-medium flex items-center gap-0.5"
                >
                  {showAll19Stages ? (
                    <>ย่อ <ChevronUp size={14} /></>
                  ) : (
                    <>ดูขั้นตอนทั้งหมด <ChevronDown size={14} /></>
                  )}
                </button>
              </div>

              {/* Collapsed view: Customer 5 Milestones */}
              {!showAll19Stages && (
                <div className="space-y-3 pt-1">
                  {CUSTOMER_MILESTONES.map((m, idx) => {
                    const isDone = currentMilestoneId > m.id
                    const isCurrent = currentMilestoneId === m.id
                    return (
                      <div key={m.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isDone
                                ? 'bg-[#1D9E75] text-white'
                                : isCurrent
                                ? 'bg-[#C8102E] text-white ring-4 ring-[#FBE7E9]'
                                : 'bg-[#E4DED2] text-[#9A9384]'
                            }`}
                          >
                            {isDone ? '✓' : m.id}
                          </div>
                          {idx < CUSTOMER_MILESTONES.length - 1 && (
                            <div className={`w-0.5 h-6 ${isDone ? 'bg-[#1D9E75]' : 'bg-[#E4DED2]'}`} />
                          )}
                        </div>
                        <div className="pt-0.5">
                          <div className={`text-xs font-semibold ${isCurrent ? 'text-[#C8102E]' : isDone ? 'text-[#2B2723]' : 'text-[#9A9384]'}`}>
                            {m.label}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Expanded view: All 19 Stages Visual Stepper */}
              {showAll19Stages && (
                <div className="space-y-2 pt-1 border-t border-[#E4DED2]">
                  {STAGE_ORDER.filter((st) => st !== 'CANCELLED').map((st, idx) => {
                    const stageIdx = STAGE_ORDER.indexOf(st)
                    const isDone = currentStageIndex > stageIdx
                    const isCurrent = currentStageIndex === stageIdx

                    return (
                      <div key={st} className="flex items-center gap-2.5 text-xs py-1">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            isDone
                              ? 'bg-[#1D9E75] text-white'
                              : isCurrent
                              ? 'bg-[#C8102E] text-white ring-2 ring-[#FBE7E9]'
                              : 'bg-[#E4DED2] text-[#9A9384]'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`${
                            isCurrent
                              ? 'font-bold text-[#C8102E]'
                              : isDone
                              ? 'font-medium text-[#2B2723]'
                              : 'text-[#9A9384]'
                          }`}
                        >
                          {STAGE_LABELS[st]}
                        </span>
                        {isCurrent && (
                          <span className="ml-auto text-[10px] bg-[#FBE7E9] text-[#9C0C22] px-2 py-0.5 rounded-full font-semibold">
                            กำลังดำเนินการ
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Timeline Event History */}
            {data.events && data.events.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-[#2B2723]">บันทึกความคืบหน้า</h3>
                <div className="space-y-3 pl-2 border-l-2 border-[#D2C9B8] text-xs">
                  {data.events.map((evt, i) => (
                    <div key={i} className="relative pl-3">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#C8102E] ring-4 ring-white" />
                      <div className="font-medium text-[#2B2723]">{evt.note || evt.type}</div>
                      <div className="text-[#9A9384] text-[10px] mt-0.5 font-mono">
                        {new Date(evt.createdAt).toLocaleString('th-TH', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-[#9A9384] py-4 border-t border-[#E4DED2] bg-[#FAF7F2]">
          ศูนย์บริการซ่อมไทวัสดุ · สอบถามข้อมูลเพิ่มเติมโทร {data.branchPhone || '1308'}
        </div>
      </div>
    </div>
  )
}
