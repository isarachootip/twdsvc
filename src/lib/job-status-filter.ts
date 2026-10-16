import { STAGE_LABELS, STAGE_ORDER, type Stage } from './constants'

/**
 * Status filter for the /jobs table.
 * "รอชำระค่าดำเนินการ" is a derived state (unpaid intake fee), NOT a JobStage — it is a virtual
 * filter option only and must never be sent to the database as an enum value.
 */
export const WAITING_INTAKE_PAYMENT = 'WAITING_INTAKE_PAYMENT'
export const WAITING_INTAKE_PAYMENT_LABEL = 'รอชำระค่าดำเนินการ'

const INTAKE_STAGES: readonly string[] = ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT']

export interface StatusFilterJob {
  stage: string
  intakeUnpaid?: boolean
}

export interface StatusFilterOption {
  value: string
  label: string
}

/** Single rule used by the table label, StageBadge and the status filter. */
export function isWaitingIntakePayment(job: StatusFilterJob): boolean {
  return Boolean(job.intakeUnpaid) && INTAKE_STAGES.includes(job.stage)
}

export function displayStageLabel(job: StatusFilterJob): string {
  if (isWaitingIntakePayment(job)) return WAITING_INTAKE_PAYMENT_LABEL
  return STAGE_LABELS[job.stage as Stage] ?? job.stage
}

export function matchesStatusFilter(job: StatusFilterJob, filter: string): boolean {
  if (!filter) return true
  if (filter === WAITING_INTAKE_PAYMENT) return isWaitingIntakePayment(job)
  return job.stage === filter
}

export function statusFilterOptions(): StatusFilterOption[] {
  return [
    { value: '', label: 'ทุกสถานะ' },
    { value: WAITING_INTAKE_PAYMENT, label: WAITING_INTAKE_PAYMENT_LABEL },
    ...STAGE_ORDER.map(s => ({ value: s as string, label: STAGE_LABELS[s] })),
  ]
}
