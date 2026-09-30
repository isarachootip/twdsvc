import { JobStage } from '@prisma/client'
import { STAGE_LABELS, type Stage } from '@/lib/constants'

interface Props {
  stage: JobStage | string
  size?: 'sm' | 'md'
  variant?: 'text' | 'badge'
  className?: string
}

export default function StageBadge({ stage, size = 'md', className = '' }: Props) {
  const label = STAGE_LABELS[stage as Stage] ?? stage
  const sz = size === 'sm' ? 'text-xs' : 'text-[13px]'
  return (
    <span className={`inline-block font-medium ${sz} stage-${stage} whitespace-nowrap ${className}`}>
      {label}
    </span>
  )
}

