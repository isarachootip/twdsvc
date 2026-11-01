'use client'

import { CheckCircle2 } from 'lucide-react'

const SATISFACTION_ASPECTS = [
  { id: 'quality', label: 'คุณภาพงานซ่อมได้มาตรฐาน' },
  { id: 'speed', label: 'ความรวดเร็วในการดำเนินการ' },
  { id: 'service', label: 'ความสุภาพและการบริการของเจ้าหน้าที่' },
  { id: 'value', label: 'ความคุ้มค่าของค่าบริการ' },
  { id: 'tracking', label: 'ระบบติดตามสถานะสะดวกรวดเร็ว' },
]

export default function CsatAspectChecklist({
  selectedAspects,
  onToggleAspect,
}: {
  selectedAspects: string[]
  onToggleAspect: (id: string) => void
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2.5">
      <h3 className="font-bold text-xs text-[#2B2723]">จุดที่ท่านพึงพอใจเป็นพิเศษ (เลือกได้มากกว่า 1 ข้อ)</h3>
      <div className="space-y-2">
        {SATISFACTION_ASPECTS.map((aspect) => {
          const checked = selectedAspects.includes(aspect.id)
          return (
            <button
              key={aspect.id}
              type="button"
              onClick={() => onToggleAspect(aspect.id)}
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
  )
}
