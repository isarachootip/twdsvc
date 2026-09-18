'use client'

import { AlertTriangle, Clock } from 'lucide-react'

interface SlaTagProps {
  hoursInStep: number
  slaHours: number
  isOverdue: boolean
  ownerDept?: string
}

export default function SlaTag({ hoursInStep, slaHours, isOverdue, ownerDept }: SlaTagProps) {
  const pct = slaHours > 0 ? (hoursInStep / slaHours) * 100 : 0
  const atRisk = !isOverdue && pct >= 80

  if (isOverdue) {
    const overageHrs = hoursInStep - slaHours
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-overdue">
        <AlertTriangle size={13} />
        เกิน {overageHrs} ชม.
        {ownerDept && <span className="font-normal opacity-70">({ownerDept})</span>}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium"
      style={{ color: atRisk ? 'var(--amber)' : 'var(--text-2)' }}
    >
      <Clock size={13} />
      {hoursInStep} / {slaHours} ชม.
    </span>
  )
}
