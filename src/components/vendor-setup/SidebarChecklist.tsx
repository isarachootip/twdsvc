'use client'

import React from 'react'
import type { VendorSetupFormData } from './types'
import type { TierCalculationResult } from '@/lib/services/vendor-tier.service'
import { CheckCircle2, AlertCircle, TrendingUp, ShieldCheck } from 'lucide-react'

interface SidebarChecklistProps {
  form: VendorSetupFormData
  tierInfo: TierCalculationResult
  currentStep: number
  onSelectStep: (step: number) => void
}

export function SidebarChecklist({ form, tierInfo, currentStep, onSelectStep }: SidebarChecklistProps) {
  const isStep1Done = Boolean(form.store.name && form.store.taxId && form.store.branches[0]?.address)
  const isStep2Done = Object.values(form.expertise.appliances).some(Boolean)
  const isStep3Done = Object.keys(form.coverage.coverage).length > 0
  const isStep4Done = Boolean(form.finance.bank && form.finance.accNo && form.finance.documents.idcard && form.finance.commission)
  const isStep5Done = Object.values(form.agreements.agreements).every(Boolean) && Boolean(form.agreements.signatureUrl)

  const stepsStatus = [
    { step: 1, title: 'ข้อมูลร้าน & สาขา', done: isStep1Done, info: `${form.store.branches.length} สาขา` },
    { step: 2, title: 'ความเชี่ยวชาญ', done: isStep2Done, info: `${Object.values(form.expertise.appliances).filter(Boolean).length} หมวด` },
    { step: 3, title: 'พื้นที่บริการ SVC', done: isStep3Done, info: `${Object.keys(form.coverage.coverage).length} สาขา` },
    { step: 4, title: 'เอกสาร & การเงิน', done: isStep4Done, info: form.finance.bank },
    { step: 5, title: 'ข้อตกลง & ลายเซ็น', done: isStep5Done, info: isStep5Done ? 'ครบถ้วน' : 'รอดำเนินการ' },
  ]

  const tierColor = tierInfo.tier === 'VIP'
    ? 'text-purple-700'
    : tierInfo.tier === 'PRO'
    ? 'text-amber-700'
    : 'text-slate-700'

  const tierDot = tierInfo.tier === 'VIP'
    ? 'bg-purple-600'
    : tierInfo.tier === 'PRO'
    ? 'bg-amber-600'
    : 'bg-slate-400'

  return (
    <div className="space-y-4">
      {/* คะแนนและการประเมิน Tier */}
      <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">ระดับคู่ค้าคาดการณ์</span>
          <span className={`text-xs font-bold ${tierColor} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tierDot}`} />
            {tierInfo.tierLabel}
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">คะแนนความพร้อมร้านค้า</span>
            <span className="font-bold text-red-700">{tierInfo.score}/100</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${tierInfo.score}%`, backgroundColor: 'var(--red)' }}
            />
          </div>
        </div>

        <div className="py-2 flex items-center justify-between text-xs border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-600">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> ประมาณการเคส:
          </span>
          <span className="font-semibold text-slate-900">{tierInfo.estimatedCases} เคส/เดือน</span>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-700 block">สิทธิประโยชน์ตามระดับ:</span>
          {tierInfo.benefits.map((b, idx) => (
            <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ความคืบหน้ารายสเต็ป */}
      <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2 shadow-xs">
        <h5 className="font-semibold text-xs pb-1.5 border-b border-slate-100 text-slate-800">
          รายการความคืบหน้า
        </h5>
        <div className="space-y-1">
          {stepsStatus.map(s => {
            const isActive = currentStep === s.step
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => onSelectStep(s.step)}
                className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                  isActive ? 'bg-red-50 text-red-800 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {s.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span>{s.step}. {s.title}</span>
                </div>
                <span className={`text-[10px] flex items-center gap-1 font-medium ${s.done ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <span className={`w-1 h-1 rounded-full ${s.done ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {s.done ? 'เรียบร้อย' : 'ยังไม่ครบ'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
