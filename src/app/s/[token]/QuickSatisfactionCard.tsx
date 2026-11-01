'use client'

import { Smile, Meh, Frown } from 'lucide-react'

export type QuickRateLevel = 'satisfied' | 'neutral' | 'unsatisfied'

interface QuickSatisfactionCardProps {
  level: QuickRateLevel
  onSelectLevel: (level: QuickRateLevel) => void
  comment: string
  onChangeComment: (v: string) => void
  submitting: boolean
}

const OPTIONS: Array<{
  id: QuickRateLevel
  label: string
  Icon: typeof Smile
  activeClass: string
  iconColor: string
}> = [
  {
    id: 'satisfied',
    label: 'พึงพอใจ',
    Icon: Smile,
    activeClass: 'border-[#1D9E75] bg-[#E1F5EE] text-[#1D9E75]',
    iconColor: '#1D9E75',
  },
  {
    id: 'neutral',
    label: 'พอใช้',
    Icon: Meh,
    activeClass: 'border-[#BA7517] bg-[#FAEEDA] text-[#8A6500]',
    iconColor: '#BA7517',
  },
  {
    id: 'unsatisfied',
    label: 'ไม่พึงพอใจ',
    Icon: Frown,
    activeClass: 'border-[#C8102E] bg-[#FBE7E9] text-[#C8102E]',
    iconColor: '#C8102E',
  },
]

export default function QuickSatisfactionCard({
  level,
  onSelectLevel,
  comment,
  onChangeComment,
  submitting,
}: QuickSatisfactionCardProps) {
  const requiresComment = level === 'unsatisfied'

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
      <div className="text-center space-y-1">
        <h3 className="font-bold text-sm text-[#2B2723]">คุณพึงพอใจกับบริการของเรามากน้อยเพียงใด</h3>
        <p className="text-[11px] text-[#6B6459]">
          ขอบคุณที่ใช้บริการไทวัสดุ โปรดร่วมแสดงความคิดเห็นเพื่อพัฒนาบริการให้ดียิ่งขึ้น
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 pt-1">
        {OPTIONS.map(({ id, label, Icon, activeClass, iconColor }) => {
          const active = level === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectLevel(id)}
              className={`p-3 rounded-xl border text-center transition-all space-y-1.5 ${
                active ? `${activeClass} font-bold shadow-sm` : 'border-[#E4DED2] bg-[#FAF7F2] text-[#2B2723]'
              }`}
            >
              <Icon size={28} className="mx-auto" style={{ color: iconColor }} />
              <div className="text-xs">{label}</div>
            </button>
          )
        })}
      </div>

      {level === 'satisfied' ? (
        <p className="text-center text-xs font-medium text-emerald-700 pt-1">
          ขอขอบคุณสำหรับความพึงพอใจของลูกค้าค่ะ
        </p>
      ) : null}

      <div className="space-y-1.5 pt-1">
        <label className="block text-xs font-bold text-[#2B2723]">
          ความคิดเห็น / ข้อเสนอแนะเพิ่มเติม {requiresComment && <span className="text-[#C8102E]">*</span>}
        </label>
        <textarea
          value={comment}
          onChange={(e) => onChangeComment(e.target.value)}
          required={requiresComment}
          disabled={submitting}
          placeholder={
            requiresComment
              ? 'กรุณากรอกความคิดเห็นของคุณเพื่อการปรับปรุงบริการ...'
              : 'เขียนข้อคิดเห็นหรือข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)...'
          }
          rows={3}
          className="w-full p-3 border border-[#D2C9B8] rounded-xl text-xs outline-none focus:border-[#C8102E] resize-none"
        />
      </div>
    </div>
  )
}
