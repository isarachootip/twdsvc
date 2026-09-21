'use client'

import { use, useEffect, useState } from 'react'
import { Star, CheckCircle2, AlertCircle, Heart, ThumbsUp } from 'lucide-react'

interface CsatData {
  jobNo: string
  productName: string
  brandName?: string
  branchName?: string
  submitted: boolean
  expired: boolean
}

const SATISFACTION_ASPECTS = [
  { id: 'quality', label: 'คุณภาพงานซ่อมได้มาตรฐาน' },
  { id: 'speed', label: 'ความรวดเร็วในการดำเนินการ' },
  { id: 'service', label: 'ความสุภาพและการบริการของเจ้าหน้าที่' },
  { id: 'value', label: 'ความคุ้มค่าของค่าบริการ' },
  { id: 'tracking', label: 'ระบบติดตามสถานะสะดวกรวดเร็ว' },
]

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className="space-y-1 text-center py-2">
      <div className="text-xs font-semibold text-[#2B2723]">{label}</div>
      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= (hover ?? value)
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(star)}
              className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
              style={{ color: active ? '#F59E0B' : '#D2C9B8' }}
              aria-label={`${star} ดาว`}
            >
              ★
            </button>
          )
        })}
      </div>
      <div className="text-[11px] text-[#6B6459]">
        {value === 5 && 'ยอดเยี่ยมมาก'}
        {value === 4 && 'ดีมาก'}
        {value === 3 && 'ปานกลาง'}
        {value === 2 && 'พอใช้'}
        {value === 1 && 'ควรปรับปรุง'}
        {value === 0 && 'กรุณาแตะเพื่อให้คะแนน'}
      </div>
    </div>
  )
}

export default function CustomerCsatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<CsatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form ratings
  const [qualityScore, setQualityScore] = useState(5)
  const [speedScore, setSpeedScore] = useState(5)
  const [selectedAspects, setSelectedAspects] = useState<string[]>([])
  const [comment, setComment] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch(`/api/public/s/${token}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? 'ลิงก์ไม่ถูกต้องหรือหมดอายุ')
        return j
      })
      .then((d) => {
        setData(d)
        if (d.submitted) setSubmitted(true)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const toggleAspect = (id: string) => {
    setSelectedAspects((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const overall = Math.round((qualityScore + speedScore) / 2)
      const res = await fetch(`/api/public/s/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: overall,
          qualityScore,
          speedScore,
          aspects: selectedAspects,
          comment,
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
          <p className="text-xs text-[#6B6459]">กำลังโหลดแบบประเมินความพึงพอใจ...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E4DED2] max-w-sm w-full text-center space-y-3">
          <AlertCircle size={44} className="text-[#C8102E] mx-auto" />
          <h2 className="font-bold text-[#2B2723] text-base">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
          <p className="text-xs text-[#6B6459]">{error || 'กรุณาติดต่อศูนย์บริการไทวัสดุ'}</p>
        </div>
      </div>
    )
  }

  if (data.expired && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E4DED2] max-w-sm w-full text-center space-y-3">
          <AlertCircle size={44} className="text-[#BA7517] mx-auto" />
          <h2 className="font-bold text-[#2B2723] text-base">แบบประเมินหมดอายุแล้ว</h2>
          <p className="text-xs text-[#6B6459]">ลิงก์ประเมินความพึงพอใจมีอายุ 14 วันหลังปิดงานซ่อม ขอบคุณที่ใช้บริการค่ะ</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F3EEE6] font-sans p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#E4DED2] max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-[#E1F5EE] text-[#1D9E75] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Heart size={36} fill="currentColor" />
          </div>
          <div>
            <h2 className="font-bold text-[#2B2723] text-lg">ขอบคุณสำหรับการประเมิน</h2>
            <p className="text-xs text-[#6B6459] mt-1 leading-relaxed">
              ความคิดเห็นอันมีค่าของท่านช่วยให้ศูนย์บริการไทวัสดุพัฒนาคุณภาพงานซ่อมและบริการให้ดียิ่งขึ้นค่ะ
            </p>
          </div>
          <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E4DED2] text-xs text-[#6B6459]">
            ใบแจ้งซ่อมเลขที่ <span className="font-mono font-bold text-[#2B2723]">{data.jobNo}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3EEE6] font-sans pb-12">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF7F2] shadow-sm flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="bg-[#C8102E] text-white py-5 px-6 text-center shadow-md">
            <h1 className="text-base font-semibold tracking-wide">ศูนย์บริการซ่อมไทวัสดุ</h1>
            <p className="text-xs opacity-90 mt-0.5 font-light">แบบประเมินความพึงพอใจการให้บริการ (CSAT)</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Job details card */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B6459]">เลขที่งาน:</span>
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

            {/* 5-Star Ratings */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
              <h3 className="font-bold text-xs text-[#2B2723] border-b border-[#E4DED2] pb-2">
                ให้คะแนนความพึงพอใจ (1 ถึง 5 ดาว)
              </h3>

              {/* Quality Rating */}
              <StarRating
                label="1. คุณภาพและความเรียบร้อยของงานซ่อม"
                value={qualityScore}
                onChange={setQualityScore}
              />

              <div className="border-t border-[#F3EEE6]" />

              {/* Speed Rating */}
              <StarRating
                label="2. ความรวดเร็วในการให้บริการและการส่งมอบ"
                value={speedScore}
                onChange={setSpeedScore}
              />
            </div>

            {/* Satisfaction Aspects Checklist */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2.5">
              <h3 className="font-bold text-xs text-[#2B2723]">จุดที่ท่านพึงพอใจเป็นพิเศษ</h3>
              <div className="space-y-2">
                {SATISFACTION_ASPECTS.map((aspect) => {
                  const checked = selectedAspects.includes(aspect.id)
                  return (
                    <button
                      key={aspect.id}
                      type="button"
                      onClick={() => toggleAspect(aspect.id)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        checked
                          ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#1D9E75] font-semibold'
                          : 'border-[#E4DED2] bg-white text-[#2B2723]'
                      }`}
                    >
                      <span>{aspect.label}</span>
                      {checked && <CheckCircle2 size={16} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Free-text Feedback Textarea */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2">
              <label className="block text-xs font-bold text-[#2B2723]">
                ข้อเสนอแนะเพิ่มเติม / ความคิดเห็นของท่าน
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="เขียนข้อคิดเห็นหรือข้อเสนอแนะเพื่อการปรับปรุงบริการ..."
                rows={3}
                className="w-full p-3 border border-[#D2C9B8] rounded-xl text-xs outline-none focus:border-[#C8102E] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm shadow hover:bg-[#9C0C22] transition-colors disabled:opacity-60"
            >
              {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งแบบประเมินความพึงพอใจ'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-[#9A9384] py-4 border-t border-[#E4DED2] bg-[#FAF7F2]">
          ศูนย์บริการซ่อมไทวัสดุ · ขอขอบพระคุณทุกความคิดเห็น
        </div>
      </div>
    </div>
  )
}
