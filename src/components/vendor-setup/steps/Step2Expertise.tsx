'use client'

import React from 'react'
import type { VendorSetupFormData } from '../types'
import { Wrench, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react'

interface Step2ExpertiseProps {
  expertise: VendorSetupFormData['expertise']
  onUpdateExpertise: (patch: Partial<VendorSetupFormData['expertise']>) => void
}

const APPLIANCE_OPTIONS = [
  { id: 'washing', name: 'เครื่องซักผ้า / อบผ้า', desc: 'ฝาหน้า, ฝาบน, เครื่องซักกึ่งอัตโนมัติ' },
  { id: 'fridge', name: 'ตู้เย็น / ตู้แช่', desc: '1 ประตู, 2 ประตู, Side-by-side, ตู้แช่ไวน์' },
  { id: 'air', name: 'แอร์ / เครื่องปรับอากาศ', desc: 'ติดผนัง, แขวน, คาสเซ็ท, อินเวอร์เตอร์' },
  { id: 'tv', name: 'ทีวี / เครื่องใช้ไฟฟ้าขนาดเล็ก', desc: 'Smart TV, OLED, เครื่องเสียง, พัดลม' },
  { id: 'waterHeater', name: 'เครื่องทำน้ำอุ่น / ปั๊มน้ำ', desc: 'น้ำอุ่นไฟฟ้า, ปั๊มน้ำบ้าน, ปั๊มแรงดัน' },
  { id: 'microwave', name: 'ไมโครเวฟ / เตาอบ / เตาไฟฟ้า', desc: 'เตาแม่เหล็ก, เตาอบลมร้อน, ฮูดดูดควัน' },
]

export function Step2Expertise({ expertise, onUpdateExpertise }: Step2ExpertiseProps) {
  const toggleAppliance = (id: string) => {
    const updated = {
      ...expertise.appliances,
      [id]: !expertise.appliances[id],
    }
    onUpdateExpertise({ appliances: updated })
  }

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl border bg-white space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <Wrench className="w-5 h-5" style={{ color: 'var(--red)' }} />
          <div>
            <h4 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
              ประเภทเครื่องใช้ไฟฟ้าที่รับบริการ (Pack Info)
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              เลือกระบบงานที่ทีมช่างมีความเชี่ยวชาญจริง ระบบ SVC จะจ่ายงานตรงตามหมวดหมู่ที่เลือก
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {APPLIANCE_OPTIONS.map(opt => {
            const isSelected = Boolean(expertise.appliances[opt.id])
            return (
              <div
                key={opt.id}
                onClick={() => toggleAppliance(opt.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  isSelected ? 'border-2 shadow-sm' : 'hover:border-slate-300'
                }`}
                style={{
                  borderColor: isSelected ? 'var(--red)' : 'var(--border)',
                  backgroundColor: isSelected ? 'var(--red-tint)' : '#FFFFFF',
                }}
              >
                <div className="mt-0.5">
                  <CheckCircle2
                    className={`w-5 h-5 ${isSelected ? 'text-red-600' : 'text-slate-300'}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {opt.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                    {opt.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-5 rounded-2xl border bg-white space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <ShieldCheck className="w-5 h-5" style={{ color: 'var(--red)' }} />
          <h4 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
            มาตรฐานบริการและการรับประกัน
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              <Clock className="w-3.5 h-3.5 inline mr-1" /> SLA วันซ่อมเฉลี่ย (วัน)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              className="inp text-sm"
              value={expertise.defaultSlaDays}
              onChange={e => onUpdateExpertise({ defaultSlaDays: Number(e.target.value) || 7 })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              รับประกันงานซ่อม (วัน)
            </label>
            <input
              type="number"
              min={30}
              max={365}
              className="inp text-sm"
              value={expertise.warrantyDays}
              onChange={e => onUpdateExpertise({ warrantyDays: Number(e.target.value) || 90 })}
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={expertise.isBrandAuthorized}
                onChange={e => onUpdateExpertise({ isBrandAuthorized: e.target.checked })}
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                เป็นศูนย์บริการแต่งตั้งจากแบรนด์ (Authorized Center)
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
