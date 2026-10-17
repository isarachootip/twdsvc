'use client'

import { GitBranch, Clock, Gauge, ArrowRight } from 'lucide-react'
import type { ManualChannel, ManualPhase, ManualFlowStep } from '@/lib/manual-catalog'
import { getOwnerStyle } from './owner-color'

interface RepairFlowSectionProps {
  channel: ManualChannel
  onChangeChannel: (ch: ManualChannel) => void
  phaseFilter: ManualPhase | 'ALL'
  onChangePhase: (ph: ManualPhase | 'ALL') => void
  steps: ManualFlowStep[]
}

const CHANNEL_OPTIONS: Array<{ id: ManualChannel; label: string; desc: string }> = [
  { id: 'DC', label: 'ผ่านคลังกลาง (DC)', desc: 'สาขา → คลัง DC → ศูนย์ซ่อม VD → คลัง DC → สาขา' },
  { id: 'DSD', label: 'VD รับ-ส่งที่สาขา (DSD)', desc: 'ช่าง/รถของศูนย์ซ่อม VD เข้ารับและส่งคืนที่สาขาโดยตรง' },
  { id: 'TPL', label: 'ขนส่งเอกชน (3PL)', desc: 'จัดส่งพัสดุด่วนผ่าน 3PL ตรงถึงศูนย์ซ่อม VD' },
]

const PHASE_OPTIONS: Array<{ id: ManualPhase | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'ทุกขั้น (1–3)' },
  { id: 1, label: 'ขั้น 1: เปิดงานและจัดส่ง' },
  { id: 2, label: 'ขั้น 2: VD ตรวจสอบ / ลูกค้าตัดสินใจ' },
  { id: 3, label: 'ขั้น 3: ส่งคืนและปิดงาน' },
]

const PHASE_TITLES: Record<ManualPhase, string> = {
  1: 'ขั้น 1 — เปิดงานและจัดส่งออกจากสาขา',
  2: 'ขั้น 2 — ศูนย์ซ่อม VD ตรวจสอบและลูกค้าตัดสินใจ',
  3: 'ขั้น 3 — ส่งคืนสาขา ส่งมอบลูกค้า และทำจ่ายเวนเดอร์',
}

export default function RepairFlowSection({
  channel,
  onChangeChannel,
  phaseFilter,
  onChangePhase,
  steps,
}: RepairFlowSectionProps) {
  const phases: ManualPhase[] = phaseFilter === 'ALL' ? [1, 2, 3] : [phaseFilter]

  return (
    <div className="space-y-6">
      {/* Section 3: 3-Phase Repair Flow */}
      <section id="section-flow" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-4 space-y-1">
          <div className="flex items-center gap-2.5">
            <GitBranch size={20} className="text-[#C8102E] shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              เส้นทางงานซ่อม 3 ขั้น (3-Phase Repair Workflow)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            ชื่อสถานะ ผู้รับผิดชอบ และเวลา SLA ดึงจากค่าที่ระบบใช้งานจริง (อัปเดตตามหน้าตั้งค่า Admin อัตโนมัติ)
          </p>
        </div>

        {/* Channel Selector */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-600">1. เลือกช่องทางขนส่ง:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CHANNEL_OPTIONS.map(opt => {
              const active = channel === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeChannel(opt.id)}
                  className={`min-h-[44px] p-3 rounded-xl border text-left transition-all cursor-pointer ${active ? 'border-[#C8102E] bg-red-50/40 ring-1 ring-red-200' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className={`text-xs sm:text-sm font-bold ${active ? 'text-[#C8102E]' : 'text-slate-800'}`}>{opt.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Phase Filter */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-600">2. กรองตามขั้นของงาน:</div>
          <div className="flex flex-wrap gap-2">
            {PHASE_OPTIONS.map(ph => {
              const active = phaseFilter === ph.id
              return (
                <button
                  key={String(ph.id)}
                  type="button"
                  onClick={() => onChangePhase(ph.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${active ? 'bg-[#A30D25] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {ph.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Steps grouped by Phase */}
        <div className="space-y-5 pt-1">
          {phases.map(ph => {
            const phaseSteps = steps.filter(s => s.phase === ph)
            if (phaseSteps.length === 0) return null
            return (
              <div key={ph} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-[#C8102E]" />
                  <span>{PHASE_TITLES[ph]}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {phaseSteps.map((st, idx) => {
                    const ownerStyle = getOwnerStyle(st.ownerDept)
                    return (
                      <div
                        key={`${st.enumCode}-${idx}`}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/40 flex flex-col justify-between gap-2.5"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {idx + 1}. {st.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${ownerStyle.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${ownerStyle.dot}`} />
                              {st.ownerLabel}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 break-all">
                            รหัส: {st.enumCode}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{st.note}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <Clock size={12} className="text-[#C8102E]" />
                            SLA: {st.slaText}
                            {st.pausable && <span className="text-amber-700">(พักรออะไหล่ได้)</span>}
                          </span>
                          <span className="font-mono text-slate-500">หน้าจอ: {st.screen}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Section 4: How to Read SLA Cards & "อยู่ใน step นี้มา" Column */}
      <section id="section-sla-guide" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Gauge size={20} className="text-[#C8102E] shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            วิธีอ่านการ์ดสรุป SLA และคอลัมน์ &ldquo;อยู่ใน step นี้มา&rdquo;
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-slate-50 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ArrowRight size={15} className="text-[#C8102E] shrink-0" />
              <span>1. การ์ดสรุป SLA ทั้ง 6 ใบบนหน้า /jobs</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              การ์ดทั้ง 6 ใบ (งานทั้งหมด, เกิน SLA: CS/ลูกค้า, ฝั่ง GR, ฝั่ง VD, ขนส่ง, และยอดค้างชำระ)
              คำนวณจาก <strong className="text-slate-900">&ldquo;งานที่ยังไม่ปิดทั้งหมดในระบบ&rdquo;</strong> โดยไม่ถูกตัดด้วยตัวกรองช่วงวันที่
              เพื่อให้ตัวเลขตรงกับหน้าคิวปฏิบัติงานจริง (<code className="font-mono">/cs</code>, <code className="font-mono">/gr</code>, <code className="font-mono">/dc</code>, <code className="font-mono">/vd</code>) เสมอ
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ArrowRight size={15} className="text-[#C8102E] shrink-0" />
              <span>2. คอลัมน์ &ldquo;อยู่ใน step นี้มา&rdquo; และเวลาเกินกำหนด</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              ระบบนับเวลาตั้งแต่วัน-เวลาที่ใบงานเข้าสู่สถานะปัจจุบัน (<code className="font-mono">stageEnteredAt</code>) เทียบกับชั่วโมง SLA มาตรฐานของขั้นตอนนั้น:
            </p>
            <div className="space-y-1 pt-1 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /><span>อยู่ในเกณฑ์ SLA: แสดงเวลาที่อยู่ในขั้นตอนปัจจุบันตามปกติ</span></div>
              <div className="flex items-center gap-2 text-amber-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /><span>พักรออะไหล่ (PAUSED): หยุดนับเวลา SLA ชั่วคราวเมื่อช่าง VD กดพักรออะไหล่</span></div>
              <div className="flex items-center gap-2 text-rose-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" /><span>เกิน SLA (Overdue): แสดงจำนวนชั่วโมง/วันที่เกินกำหนดด้วยตัวอักษรสีแดง พร้อมระบุฝ่ายที่รับผิดชอบ</span></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
