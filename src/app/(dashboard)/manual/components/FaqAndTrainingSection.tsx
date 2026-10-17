'use client'

import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, GraduationCap, UserCheck } from 'lucide-react'
import TrainingKitViewer from '@/components/manual/TrainingKitViewer'
import type { ManualFaqItem } from '@/lib/manual-catalog'

interface FaqAndTrainingSectionProps {
  faqs: ManualFaqItem[]
}

export default function FaqAndTrainingSection({ faqs }: FaqAndTrainingSectionProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'faq-unpaid-gr': true })

  const toggleFaq = (id: string) => {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6">
      {/* Section 7: Collapsible FAQ Accordion */}
      {faqs.length > 0 && (
        <section id="section-faq" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <HelpCircle size={20} className="text-[#C8102E] shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                คำถามที่พบบ่อยและการแก้ไขปัญหาหน้างาน (FAQ)
              </h2>
              <p className="text-xs text-slate-500">คลิกที่คำถามเพื่อเปิดหรือปิดดูแนวทางแก้ไขปัญหา</p>
            </div>
          </div>

          <div className="divide-y divide-slate-200/80 border border-slate-200/80 rounded-xl overflow-hidden">
            {faqs.map(faq => {
              const isOpen = Boolean(openIds[faq.id])
              return (
                <div key={faq.id} className="bg-white">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Q: {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-[#C8102E] shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3.5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Section 8: Role Training Kits & Training Account Notice */}
      <section id="section-training" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={22} className="text-[#C8102E] shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                หลักสูตรฝึกอบรมและแบบทดสอบประจำบทบาท (Training Kit)
              </h2>
              <p className="text-xs text-slate-500">
                คู่มือฝึกหัด แบบฝึกหัดหน้างานจริง และแบบทดสอบพร้อมเฉลย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50/60 text-xs text-slate-700">
            <UserCheck size={16} className="text-[#C8102E] shrink-0" />
            <span className="font-semibold text-[#A30D25]">ขอบัญชีฝึกอบรมจากผู้ดูแลระบบ</span>
          </div>
        </div>

        <TrainingKitViewer />
      </section>
    </div>
  )
}
