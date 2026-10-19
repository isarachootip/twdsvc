import { STAGE_LABELS, STAGE_ORDER, type Stage } from './constants'

/**
 * Status filter for the /jobs table.
 * "รอชำระค่าดำเนินการ" is a derived state (unpaid intake fee), NOT a JobStage — it is a virtual
 * filter option only and must never be sent to the database as an enum value.
 */
export const WAITING_INTAKE_PAYMENT = 'WAITING_INTAKE_PAYMENT'
export const WAITING_INTAKE_PAYMENT_LABEL = 'รอชำระค่าดำเนินการ'

export const WAITING_MANAGER_SIGN = 'WAITING_MANAGER_SIGN'
export const WAITING_MANAGER_SIGN_LABEL = 'รอ ผจก. ลงนามอนุมัติ'

export const WAITING_CUSTOMER_APPROVAL = 'WAITING_CUSTOMER_APPROVAL'
export const WAITING_CUSTOMER_APPROVAL_LABEL = 'รอลูกค้าอนุมัติ'

const INTAKE_STAGES: readonly string[] = ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT']

export interface StatusFilterJob {
  stage: string
  intakeUnpaid?: boolean
  quote?: { managerSignedAt?: string | Date | null } | null
}

export interface StatusFilterOption {
  value: string
  label: string
}

/** Single rule used by the table label, StageBadge and the status filter. */
export function isWaitingIntakePayment(job: StatusFilterJob): boolean {
  return Boolean(job.intakeUnpaid) && INTAKE_STAGES.includes(job.stage)
}

export function isWaitingManagerSign(job: StatusFilterJob): boolean {
  return job.stage === 'WAITING_APPROVAL' && !job.quote?.managerSignedAt
}

export function displayStageLabel(job: StatusFilterJob): string {
  if (isWaitingIntakePayment(job)) return WAITING_INTAKE_PAYMENT_LABEL
  if (isWaitingManagerSign(job)) return WAITING_MANAGER_SIGN_LABEL
  return STAGE_LABELS[job.stage as Stage] ?? job.stage
}

export function matchesStatusFilter(job: StatusFilterJob, filter: string): boolean {
  if (!filter) return true
  if (filter === WAITING_INTAKE_PAYMENT) return isWaitingIntakePayment(job)
  if (filter === WAITING_MANAGER_SIGN) return isWaitingManagerSign(job)
  if (filter === WAITING_CUSTOMER_APPROVAL) return job.stage === 'WAITING_APPROVAL' && !!job.quote?.managerSignedAt
  return job.stage === filter
}

export function statusFilterOptions(includeExtraVirtuals = false): StatusFilterOption[] {
  const base: StatusFilterOption[] = [
    { value: '', label: 'ทุกสถานะ' },
    { value: WAITING_INTAKE_PAYMENT, label: WAITING_INTAKE_PAYMENT_LABEL },
  ]
  if (includeExtraVirtuals) {
    base.push({ value: WAITING_MANAGER_SIGN, label: WAITING_MANAGER_SIGN_LABEL })
  }
  return [
    ...base,
    ...STAGE_ORDER.map(s => ({ value: s as string, label: STAGE_LABELS[s] })),
  ]
}
