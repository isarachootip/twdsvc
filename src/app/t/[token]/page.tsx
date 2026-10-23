'use client'

import { useState, useEffect, use } from 'react'
import { AlertCircle } from 'lucide-react'
import { STAGE_LABELS, Stage } from '@/lib/constants'
import { useBranding } from '@/lib/hooks/useBranding'
import { getCustomerMilestoneId } from '@/lib/tracking-milestones'
import TrackingActionBanners from './components/TrackingActionBanners'
import TrackingSignCards from './components/TrackingSignCards'
import TrackingJobDetailsCard from './components/TrackingJobDetailsCard'

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
  balance: number
  payUrl?: string | null
  csatUrl?: string | null
  intakeSignatureUrl?: string | null
  pickupSignatureUrl?: string | null
  activeQuote: {
    quoteNo: string
    status: string
    total: number
    repairDays?: number
    quoteUrl: string | null
  } | null
}

export default function PublicTrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const { branding } = useBranding()
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = () => {
    fetch(`/api/public/t/${token}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? 'ไม่พบข้อมูลการติดตาม หรือลิงก์หมดอายุ')
        return j
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
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

  const currentStageLabel = STAGE_LABELS[data.stage] || data.stage
  const currentMilestoneId = getCustomerMilestoneId(data.stage)

  return (
    <div className="min-h-screen bg-[#F3EEE6] font-sans pb-12">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF7F2] shadow-sm flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="bg-[#C8102E] text-white py-4 px-6 text-center shadow-md">
            <div className="flex items-center justify-center gap-3 mb-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.logoUrl}
                alt={branding.companyName}
                className="h-8 max-w-[130px] object-contain bg-white/95 rounded px-1.5 py-0.5"
              />
              <h1 className="text-base font-semibold tracking-wide">ศูนย์บริการซ่อมไทวัสดุ</h1>
            </div>
            <p className="text-xs opacity-90 font-light">ติดตามสถานะงานซ่อม — {data.jobNo}</p>
          </div>

          <div className="p-4 space-y-3.5">
            <TrackingActionBanners
              stage={data.stage}
              activeQuote={data.activeQuote}
              balance={data.balance}
              payUrl={data.payUrl}
              csatUrl={data.csatUrl}
            />

            {/* Customer Digital Signature Actions & Status */}
            <TrackingSignCards
              token={token}
              stage={data.stage}
              intakeSignatureUrl={data.intakeSignatureUrl}
              pickupSignatureUrl={data.pickupSignatureUrl}
              customerName={data.customerName}
              jobNo={data.jobNo}
              onSigned={loadData}
            />

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

            <TrackingJobDetailsCard
              jobNo={data.jobNo}
              customerName={data.customerName}
              productName={data.productName}
              brandName={data.brandName}
              symptom={data.symptom}
              customerPhone={data.customerPhone}
              estimatedCompletionDate={data.estimatedCompletionDate}
              branchName={data.branchName}
              branchPhone={data.branchPhone}
              currentMilestoneId={currentMilestoneId}
            />
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
