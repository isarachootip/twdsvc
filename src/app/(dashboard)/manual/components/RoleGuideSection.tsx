'use client'

import { AlertTriangle, Monitor, CheckCircle2, Users } from 'lucide-react'
import { STAGE_LABELS } from '@/lib/constants'
import type { ManualRoleGuide, ManualRoleId } from '@/lib/manual-catalog'

interface RoleGuideSectionProps {
  roles: ManualRoleGuide[]
  selectedRole: ManualRoleId
  onSelectRole: (role: ManualRoleId) => void
  isSearching: boolean
}

export default function RoleGuideSection({
  roles,
  selectedRole,
  onSelectRole,
  isSearching,
}: RoleGuideSectionProps) {
  if (roles.length === 0) return null

  const activeGuides = isSearching
    ? roles
    : roles.filter(r => r.id === selectedRole)

  const displayGuides = activeGuides.length > 0 ? activeGuides : [roles[0]]

  return (
    <section id="section-roles" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <Users size={20} className="text-[#C8102E] shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              คู่มือปฏิบัติงานตามบทบาท (Role-Based Guide)
            </h2>
            <p className="text-xs text-slate-500">
              เลือกบทบาทเพื่อดูหน้าจอที่ใช้ สถานะที่ดูแล และขั้นตอนปฏิบัติงานทีละขั้น
            </p>
          </div>
        </div>
      </div>

      {/* Role Selector Buttons (min-h-[44px]) */}
      <div className="flex flex-wrap gap-2">
        {roles.map(role => {
          const active = !isSearching && selectedRole === role.id
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelectRole(role.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#C8102E] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {role.badge} — {role.id === 'S2' ? 'สต็อกสาขา (S2)' : role.title.split('(')[0].trim()}
            </button>
          )
        })}
      </div>

      {/* Selected Role Card(s) */}
      <div className="space-y-6">
        {displayGuides.map(guide => (
          <div key={guide.id} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50/80 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {guide.badge}: {guide.title}
                  </h3>
                  <p className="text-xs font-medium text-[#A30D25] mt-0.5">{guide.subtitle}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Monitor size={14} className="text-[#C8102E] shrink-0" />
                  <span>หน้าจอที่ใช้:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {guide.screens.join(', ')}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {guide.description}
              </p>

              {/* Managed Stages (Borderless semantic typography per Rule 6) */}
              <div className="pt-1">
                <div className="text-xs font-semibold text-slate-500 mb-1.5">สถานะงานที่รับผิดชอบดูแล:</div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                  {guide.managedStages.map(st => (
                    <span key={st} className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] shrink-0" />
                      <span>{STAGE_LABELS[st]}</span>
                      <span className="font-mono text-[11px] text-slate-400">({st})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {guide.steps.map(step => (
                <div key={step.title} className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <div className="flex items-start gap-2 font-bold text-sm text-slate-900">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{step.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">{step.detail}</p>
                  {step.warning && (
                    <div className="flex items-start gap-1.5 pl-6 pt-1 text-xs font-medium text-rose-600">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-600" />
                      <span>ข้อควรระวัง: {step.warning}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
