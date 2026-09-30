import { JobStage } from '@prisma/client'
import { STAGE_LABELS, type Stage } from '@/lib/constants'

interface Props {
  stage: JobStage | string
  intakeUnpaid?: boolean
  size?: 'sm' | 'md'
  variant?: 'text' | 'badge'
  className?: string
}

export default function StageBadge({ stage, intakeUnpaid, size = 'md', className = '' }: Props) {
  const isWaitingPayment = stage === 'CS_OPENED' && Boolean(intakeUnpaid)
  const label = isWaitingPayment ? 'รอชำระค่าดำเนินการ' : (STAGE_LABELS[stage as Stage] ?? stage)
  const sz = size === 'sm' ? 'text-xs' : 'text-[13px]'
  const colorCls = isWaitingPayment ? 'text-[#BA7517] font-semibold' : `stage-${stage}`
  return (
    <span className={`inline-block font-medium ${sz} ${colorCls} whitespace-nowrap ${className}`}>
      {label}
    </span>
  )
}

