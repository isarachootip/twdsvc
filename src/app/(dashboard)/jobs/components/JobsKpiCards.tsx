'use client'

import type { JobView } from '@/lib/job-view'

export const KPI_DEFS: Array<{ key: string | null; label: string; cls: string }> = [
  { key: null, label: 'งานทั้งหมด', cls: 'total' },
  { key: 'GR', label: 'เกิน SLA ฝั่ง GR', cls: 'urgent' },
  { key: 'VD', label: 'เกิน SLA ฝั่ง VD', cls: 'urgent' },
  { key: 'transport', label: 'เกิน SLA ฝั่งขนส่ง (DC/3PL)', cls: 'urgent' },
  { key: 'CS', label: 'เกิน SLA ฝั่ง CS/ลูกค้า', cls: 'urgent' },
  { key: 'unpaid', label: 'ยอดค้างชำระ', cls: 'urgent' },
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

export default function JobsKpiCards({ jobs, flag, onToggleFlag }: JobsKpiCardsProps) {
  const count = (key: string | null) => jobs.filter(j => matchFlag(j, key)).length

  return (
    <div className="kpi-grid">
      {KPI_DEFS.map(k => (
        <button
          key={k.label}
          className={`kpi-card ${k.cls} ${flag === k.key && k.key !== null ? 'active' : ''}`}
          onClick={() => onToggleFlag(k.key)}
        >
          <div className="num">{count(k.key)}</div>
          <div className="lbl">{k.label}</div>
        </button>
      ))}
    </div>
  )
}
