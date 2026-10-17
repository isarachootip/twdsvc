'use client'

import { ListChecks, ShieldAlert } from 'lucide-react'
import type { ManualStageRow, ManualRuleItem } from '@/lib/manual-catalog'
import { getOwnerStyle } from './owner-color'

interface StagesAndRulesSectionProps {
  allStages: ManualStageRow[]
  rules: ManualRuleItem[]
}

export default function StagesAndRulesSection({
  allStages,
  rules,
}: StagesAndRulesSectionProps) {
  return (
    <div className="space-y-6">
      {/* Section 5: All Stages Table */}
      {allStages.length > 0 && (
        <section id="section-stages" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <ListChecks size={20} className="text-[#C8102E] shrink-0" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  ตารางสถานะงานซ่อมทั้งหมด ({allStages.length} สถานะ)
                </h2>
                <p className="text-xs text-slate-500">
                  อ้างอิงชื่อสถานะภาษาไทย รหัส Enum ผู้รับผิดชอบ และเวลา SLA จากระบบจริง
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[680px] text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-semibold w-16">ขั้น</th>
                  <th className="py-2.5 px-3 font-semibold">สถานะ (ภาษาไทย)</th>
                  <th className="py-2.5 px-3 font-semibold">รหัส (Enum)</th>
                  <th className="py-2.5 px-3 font-semibold">ผู้รับผิดชอบ</th>
                  <th className="py-2.5 px-3 font-semibold">SLA</th>
                  <th className="py-2.5 px-3 font-semibold">สิ่งที่ต้องทำต่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allStages.map(row => {
                  const ownerStyle = getOwnerStyle(row.ownerDept)
                  return (
                    <tr key={row.stage} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        ขั้น {row.phase}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {row.label}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {row.stage}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 font-semibold ${ownerStyle.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ownerStyle.dot}`} />
                          {row.ownerLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {row.slaText}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                        {row.nextAction}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Section 6: Enforced System Rules */}
      {rules.length > 0 && (
        <section id="section-rules" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <ShieldAlert size={20} className="text-[#C8102E] shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                กฎที่ระบบบังคับ (Enforced Business Rules)
              </h2>
              <p className="text-xs text-slate-500">
                เงื่อนไขสำคัญที่ระบบตรวจสอบอัตโนมัติในทุกขั้นตอนของการปฏิบัติงาน
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {rules.map(rule => (
              <div
                key={rule.code}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{rule.title}</h3>
                  <span className="font-mono text-[11px] font-semibold text-[#C8102E] shrink-0">
                    {rule.code}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#A30D25]">{rule.summary}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{rule.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
