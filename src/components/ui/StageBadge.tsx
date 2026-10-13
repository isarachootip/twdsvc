import { JobStage } from '@prisma/client'
import { STAGE_LABELS, STAGE_BADGE, type Stage } from '@/lib/constants'

interface Props {
  stage: JobStage | string
  intakeUnpaid?: boolean
  size?: 'sm' | 'md'
  variant?: 'text' | 'badge'
  className?: string
}

type BadgeTheme = {
  bg: string
  text: string
  border: string
  dot: string
}

const THEME_MAP: Record<string, BadgeTheme> = {
  'b-gray': {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  'b-amber': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  'b-blue': {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  'b-green': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'b-coral': {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  'b-red': {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
}

export default function StageBadge({
  stage,
  intakeUnpaid,
  size = 'md',
  variant = 'badge',
  className = '',
}: Props) {
  const isWaitingPayment = stage === 'CS_OPENED' && Boolean(intakeUnpaid)
  const label = isWaitingPayment ? 'รอชำระค่าดำเนินการ' : (STAGE_LABELS[stage as Stage] ?? stage)
  const badgeKey = isWaitingPayment ? 'b-amber' : (STAGE_BADGE[stage as Stage] ?? 'b-gray')
  const theme = THEME_MAP[badgeKey] ?? THEME_MAP['b-gray']

  if (variant === 'text') {
    const sz = size === 'sm' ? 'text-xs' : 'text-[13px]'
    return (
      <span className={`inline-block font-medium ${sz} ${theme.text} whitespace-nowrap ${className}`}>
        {label}
      </span>
    )
  }

  const sz = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs whitespace-nowrap transition-colors ${sz} ${theme.bg} ${theme.text} ${theme.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
      <span>{label}</span>
    </span>
  )
}
