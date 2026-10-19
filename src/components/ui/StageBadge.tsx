import { JobStage } from '@prisma/client'
import { STAGE_BADGE, type Stage } from '@/lib/constants'
import { displayStageLabel, isWaitingIntakePayment } from '@/lib/job-status-filter'

interface Props {
  stage: JobStage | string
  intakeUnpaid?: boolean
  managerSigned?: boolean | null
  quote?: { managerSignedAt?: string | Date | null } | null
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
    bg: '',
    text: 'text-slate-600',
    border: '',
    dot: 'bg-slate-400',
  },
  'b-amber': {
    bg: '',
    text: 'text-amber-600',
    border: '',
    dot: 'bg-amber-500',
  },
  'b-blue': {
    bg: '',
    text: 'text-sky-600',
    border: '',
    dot: 'bg-sky-500',
  },
  'b-green': {
    bg: '',
    text: 'text-emerald-600',
    border: '',
    dot: 'bg-emerald-500',
  },
  'b-coral': {
    bg: '',
    text: 'text-orange-600',
    border: '',
    dot: 'bg-orange-500',
  },
  'b-red': {
    bg: '',
    text: 'text-rose-600',
    border: '',
    dot: 'bg-rose-500',
  },
}

export default function StageBadge({
  stage,
  intakeUnpaid,
  managerSigned,
  quote,
  size = 'md',
  variant = 'badge',
  className = '',
}: Props) {
  const quoteData = quote ?? (managerSigned !== undefined ? { managerSignedAt: managerSigned ? new Date() : null } : undefined)
  const isWaitingPayment = isWaitingIntakePayment({ stage, intakeUnpaid })
  const label = displayStageLabel({ stage, intakeUnpaid, quote: quoteData })
  const isWaitingSign = stage === 'WAITING_APPROVAL' && quoteData && !quoteData.managerSignedAt
  const badgeKey = isWaitingPayment ? 'b-amber' : isWaitingSign ? 'b-amber' : (STAGE_BADGE[stage as Stage] ?? 'b-gray')
  const theme = THEME_MAP[badgeKey] ?? THEME_MAP['b-gray']

  if (variant === 'text') {
    const sz = size === 'sm' ? 'text-xs' : 'text-[13px]'
    return (
      <span className={`inline-block font-medium ${sz} ${theme.text} whitespace-nowrap ${className}`}>
        {label}
      </span>
    )
  }

  const sz = size === 'sm' ? 'text-[11px]' : 'text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium whitespace-nowrap ${sz} ${theme.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
      <span>{label}</span>
    </span>
  )
}
