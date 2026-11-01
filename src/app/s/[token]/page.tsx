'use client'

import { use, useEffect, useState } from 'react'
import { AlertCircle, Heart, Phone } from 'lucide-react'
import QuickSatisfactionCard, { type QuickRateLevel } from './QuickSatisfactionCard'
import CsatAspectChecklist from './CsatAspectChecklist'

interface CsatData {
  jobNo: string
  productName: string
  brandName?: string
  branchName?: string
  submitted: boolean
  expired: boolean
}

const SCORE_BY_LEVEL: Record<QuickRateLevel, number> = {
  satisfied: 5,
  neutral: 3,
  unsatisfied: 1,
}

export default function CustomerCsatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<CsatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [level, setLevel] = useState<QuickRateLevel>('satisfied')
  const [selectedAspects, setSelectedAspects] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const rate = new URLSearchParams(window.location.search).get('rate')
    if (rate === 'unsatisfied' || rate === 'neutral' || rate === 'satisfied') {
      setLevel(rate)
    }
  }, [])

  useEffect(() => {
    fetch(`/api/public/s/${token}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? 'ลิงก์ไม่ถูกต้องหรือหมดอายุ')
        return j
      })
      .then((d: CsatData) => {
        setData(d)
        if (d.submitted) setSubmitted(true)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'))
      .finally(() => setLoading(false))
  }, [token])

  const toggleAspect = (id: string) => {
    setSelectedAspects((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (level === 'unsatisfied' && !comment.trim()) {
      alert('กรุณากรอกความคิดเห็นของท่านเพื่อการปรับปรุงบริการ')
      return
    }
    setSubmitting(true)
    try {
      const score = SCORE_BY_LEVEL[level]
      const res = await fetch(`/api/public/s/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          qualityScore: score,
          speedScore: score,
          aspects: selectedAspects,
          comment: comment.trim(),
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'เกิดข้อผิดพลาด')
      setSubmitted(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#6B6459]">กำลังโหลดแบบสำรวจความพึงพอใจ...</p>
        </div>
      </div>
    )
  }

  if (error || !data || (data.expired && !submitted)) {
    const isExpired = Boolean(data?.expired && !error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E4DED2] max-w-sm w-full text-center space-y-3">
          <AlertCircle size={44} className={`${isExpired ? 'text-[#BA7517]' : 'text-[#C8102E]'} mx-auto`} />
          <h2 className="font-bold text-[#2B2723] text-base">
            {isExpired ? 'แบบประเมินหมดอายุแล้ว' : 'ลิงก์ไม่ถูกต้องหรือหมดอายุ'}
          </h2>
          <p className="text-xs text-[#6B6459]">
            {isExpired
              ? 'ลิงก์ประเมินความพึงพอใจมีอายุ 14 วันหลังปิดงานซ่อม ขอบคุณที่ใช้บริการค่ะ'
              : error || 'กรุณาติดต่อศูนย์บริการไทวัสดุ 1308'}
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F3EEE6] font-sans p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#E4DED2] max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-[#E1F5EE] text-[#1D9E75] rounded-full flex items-center justify-center mx-auto">
            <Heart size={36} fill="currentColor" />
          </div>
          <div>
            <h2 className="font-bold text-[#2B2723] text-lg">ประเมินความพึงพอใจเรียบร้อย</h2>
            <p className="text-xs text-[#6B6459] mt-1 leading-relaxed">
              ขอขอบคุณสำหรับความคิดเห็นของลูกค้าค่ะ ข้อมูลของท่านช่วยให้ไทวัสดุพัฒนาบริการให้ดียิ่งขึ้น
            </p>
          </div>
          <div className="text-xs text-[#6B6459] pt-1">
            เลขที่ใบส่งซ่อม <span className="font-mono font-bold text-[#2B2723]">{data.jobNo}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3EEE6] font-sans pb-12">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF7F2] shadow-sm flex flex-col justify-between">
        <div>
          <div className="bg-[#C8102E] text-white py-5 px-6 text-center shadow-md">
            <h1 className="text-base font-semibold tracking-wide">ศูนย์บริการซ่อมไทวัสดุ</h1>
            <p className="text-xs opacity-90 mt-0.5 font-light">สำรวจความพึงพอใจหลังการซ่อมสินค้า</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B6459]">เลขที่ใบส่งซ่อม:</span>
                <span className="font-mono font-bold text-[#2B2723]">{data.jobNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6459]">สินค้า:</span>
                <span className="font-medium text-[#2B2723]">{data.productName}</span>
              </div>
              {data.branchName && (
                <div className="flex justify-between">
                  <span className="text-[#6B6459]">สาขา:</span>
                  <span className="text-[#2B2723]">{data.branchName}</span>
                </div>
              )}
            </div>

            <QuickSatisfactionCard
              level={level}
              onSelectLevel={setLevel}
              comment={comment}
              onChangeComment={setComment}
              submitting={submitting}
            />

            {level !== 'unsatisfied' && (
              <CsatAspectChecklist selectedAspects={selectedAspects} onToggleAspect={toggleAspect} />
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm shadow hover:bg-[#9C0C22] transition-colors disabled:opacity-60"
            >
              {submitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการประเมินความพึงพอใจ'}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-[#9A9384] py-4 px-4 border-t border-[#E4DED2] bg-[#FAF7F2]">
          <div className="flex items-center justify-center gap-1 text-[#2B2723] font-medium">
            <Phone size={12} className="text-[#C8102E]" />
            <a href="tel:1308">หากมีข้อเสนอแนะติดต่อได้ที่ 1308 (07:00 – 20:00 น.)</a>
          </div>
        </div>
      </div>
    </div>
  )
}
