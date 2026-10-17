'use client'

import { useState, useMemo } from 'react'
import { BookOpen, Search, X, Printer } from 'lucide-react'
import {
  getFlowStepsForChannel,
  filterManualContent,
  type ManualCatalog,
  type ManualRoleId,
  type ManualChannel,
  type ManualPhase,
} from '@/lib/manual-catalog'
import RoleGuideSection from './components/RoleGuideSection'
import RepairFlowSection from './components/RepairFlowSection'
import StagesAndRulesSection from './components/StagesAndRulesSection'
import FaqAndTrainingSection from './components/FaqAndTrainingSection'

interface ManualClientProps {
  catalog: ManualCatalog
}

const SECTION_NAV: Array<{ id: string; label: string }> = [
  { id: 'section-roles', label: 'คู่มือตามบทบาท' },
  { id: 'section-flow', label: 'เส้นทางงานซ่อม 3 ขั้น' },
  { id: 'section-sla-guide', label: 'วิธีอ่าน SLA' },
  { id: 'section-stages', label: 'ตารางสถานะทั้งหมด' },
  { id: 'section-rules', label: 'กฎที่ระบบบังคับ' },
  { id: 'section-faq', label: 'คำถามที่พบบ่อย (FAQ)' },
  { id: 'section-training', label: 'หลักสูตรอบรม' },
]

export default function ManualClient({ catalog }: ManualClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<ManualRoleId>('CS')
  const [channel, setChannel] = useState<ManualChannel>('DC')
  const [phaseFilter, setPhaseFilter] = useState<ManualPhase | 'ALL'>('ALL')

  const isSearching = searchTerm.trim().length > 0
  const filtered = useMemo(() => filterManualContent(catalog, searchTerm), [catalog, searchTerm])

  const flowSteps = useMemo(() => {
    const base = getFlowStepsForChannel(catalog, channel, phaseFilter)
    if (!isSearching) return base
    const q = searchTerm.trim().toLowerCase()
    return base.filter(s =>
      `${s.label} ${s.enumCode} ${s.ownerLabel} ${s.slaText} ${s.screen} ${s.note}`.toLowerCase().includes(q)
    )
  }, [catalog, channel, phaseFilter, isSearching, searchTerm])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      className="max-w-7xl mx-auto space-y-6 pb-16 overflow-x-hidden"
      style={{ fontFamily: "'IBM Plex Sans Thai', 'Sarabun', sans-serif" }}
    >
      {/* Section 1: Header + Real-time Search */}
      <header
        className="rounded-2xl p-5 sm:p-7 text-white shadow-md space-y-5"
        style={{ background: 'linear-gradient(135deg, #C8102E 0%, #A30D25 100%)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-red-100">
              <BookOpen size={15} />
              <span>THAIWASADU SERVICE CENTER — คู่มือระบบปฏิบัติการงานซ่อม</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              คู่มือการใช้งานระบบ & มาตรฐานการปฏิบัติงาน
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
              อ้างอิงขั้นตอนตามบทบาท เส้นทางงานซ่อม 3 ขั้น เวลา SLA และกฎธุรกิจจากค่าที่ตั้งไว้ในระบบจริง
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                aria-label="ค้นหาคู่มือการใช้งาน"
                placeholder="ค้นหาชื่อสถานะ, รหัส Enum, กฎ, FAQ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              {isSearching && (
                <button
                  type="button"
                  aria-label="ล้างคำค้นหา"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer no-print"
            >
              <Printer size={16} />
              <span>พิมพ์ / PDF</span>
            </button>
          </div>
        </div>

        {/* Quick Section Navigation (min-h-[44px]) */}
        <nav aria-label="หมวดหมู่คู่มือ" className="flex flex-wrap gap-2 pt-3 border-t border-white/15 no-print">
          {SECTION_NAV.map(sec => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white text-white hover:text-[#A30D25] text-xs font-semibold transition-colors cursor-pointer"
            >
              {sec.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Section 2: Role Guides */}
      <RoleGuideSection
        roles={filtered.roles}
        selectedRole={selectedRole}
        onSelectRole={setSelectedRole}
        isSearching={isSearching}
      />

      {/* Section 3 & 4: 3-Phase Repair Flow & SLA Reading Guide */}
      <RepairFlowSection
        channel={channel}
        onChangeChannel={setChannel}
        phaseFilter={phaseFilter}
        onChangePhase={setPhaseFilter}
        steps={flowSteps}
      />

      {/* Section 5 & 6: All Stages Table & Enforced System Rules */}
      <StagesAndRulesSection
        allStages={filtered.allStages}
        rules={filtered.rules}
      />

      {/* Section 7 & 8: Collapsible FAQ & Role Training Kits */}
      <FaqAndTrainingSection faqs={filtered.faqs} />
    </div>
  )
}
