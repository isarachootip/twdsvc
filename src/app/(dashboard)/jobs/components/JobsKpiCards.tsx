'use client'

import type { JobView } from '@/lib/job-view'

export interface KpiItemDef {
  key: string | null
  label: string
  sublabel?: string
  icon: string
  tone: 'primary' | 'cs' | 'gr' | 'vd' | 'transport' | 'finance'
}

export const KPI_DEFS: KpiItemDef[] = [
  { key: null, label: 'งานทั้งหมด', sublabel: 'ในระบบ', icon: 'total', tone: 'primary' },
  { key: 'CS', label: 'เกิน SLA: CS/ลูกค้า', sublabel: 'รอดำเนินการ', icon: 'cs', tone: 'cs' },
  { key: 'GR', label: 'เกิน SLA: ฝั่ง GR', sublabel: 'รับ-แพ็คสินค้า', icon: 'gr', tone: 'gr' },
  { key: 'VD', label: 'เกิน SLA: ฝั่ง VD', sublabel: 'ศูนย์ซ่อม', icon: 'vd', tone: 'vd' },
  { key: 'transport', label: 'เกิน SLA: ขนส่ง', sublabel: 'DC / 3PL', icon: 'transport', tone: 'transport' },
  { key: 'unpaid', label: 'ยอดค้างชำระ', sublabel: 'ค่าดำเนินการ/ซ่อม', icon: 'unpaid', tone: 'finance' },
]

export function matchFlag(j: JobView, flag: string | null) {
  if (!flag) return true
  if (flag === 'unpaid') return j.unpaid
  if (!j.overdue) return false
  if (flag === 'overdue') return true
  if (flag === 'transport') return ['DC', 'TPL', 'CARRIER'].includes(j.overdueOwner ?? '')
  if (flag === 'CS') return ['CS', 'CUSTOMER'].includes(j.overdueOwner ?? '')
  return j.overdueOwner === flag
}

interface JobsKpiCardsProps {
  jobs: JobView[]
  flag: string | null
  onToggleFlag: (key: string | null) => void
}

function KpiIcon({ name, active, urgent }: { name: string; active: boolean; urgent: boolean }) {
  const cls = urgent ? 'text-rose-500' : active ? 'text-red-600' : 'text-slate-400'
  if (name === 'total') {
    return (
      <svg className={`w-4 h-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  }
  if (name === 'cs') {
    return (
      <svg className={`w-4 h-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
  if (name === 'gr') {
    return (
      <svg className={`w-4 h-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  }
  if (name === 'vd') {
    return (
      <svg className={`w-4 h-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
  if (name === 'transport') {
    return (
      <svg className={`w-4 h-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    )
  }
  return (
    <svg className={`w-4 h-4 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function JobsKpiCards({ jobs, flag, onToggleFlag }: JobsKpiCardsProps) {
  const count = (key: string | null) => jobs.filter(j => matchFlag(j, key)).length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {KPI_DEFS.map(k => {
        const val = count(k.key)
        const isActive = (k.key === null && flag === null) || (k.key !== null && flag === k.key)
        const isUrgent = k.key !== null && val > 0

        return (
          <button
            key={k.label}
            type="button"
            onClick={() => onToggleFlag(k.key)}
            className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-red-50/40 border-red-600 ring-2 ring-red-100 shadow-sm'
                : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between gap-1 w-full mb-2">
              <span className="text-xs font-medium text-slate-500 truncate">{k.label}</span>
              <div className={`p-1.5 rounded-lg ${isUrgent ? 'bg-rose-50' : isActive ? 'bg-red-100/60' : 'bg-slate-100'}`}>
                <KpiIcon name={k.icon} active={isActive} urgent={isUrgent} />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-auto">
              <span className={`text-2xl font-bold tracking-tight ${isUrgent ? 'text-rose-600' : val === 0 ? 'text-slate-400' : 'text-slate-800'}`}>
                {val}
              </span>
              {k.key !== null && val > 0 && (
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded-full">
                  เร่งด่วน
                </span>
              )}
              {k.key !== null && val === 0 && (
                <span className="text-[10px] text-slate-400">ปกติ</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
