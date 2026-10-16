import { describe, it, expect, setTier } from '../framework/core'
import { STAGE_LABELS, STAGE_ORDER } from '../../src/lib/constants'
import {
  WAITING_INTAKE_PAYMENT,
  displayStageLabel,
  isWaitingIntakePayment,
  matchesStatusFilter,
  statusFilterOptions,
} from '../../src/lib/job-status-filter'

setTier('Tier 1')

const WAITING_LABEL = 'รอชำระค่าดำเนินการ'

const job = (stage: string, intakeUnpaid: boolean) => ({ stage, intakeUnpaid })

describe('Unit: Status filter — virtual "รอชำระค่าดำเนินการ" option (Phase 2)', () => {
  it('STATUS-01: an empty filter ("ทุกสถานะ") matches every job', () => {
    expect(matchesStatusFilter(job('GR_RECEIVED', false), '')).toBe(true)
    expect(matchesStatusFilter(job('CS_OPENED', true), '')).toBe(true)
  })

  it('STATUS-02: a real stage filter matches on stage only', () => {
    expect(matchesStatusFilter(job('GR_RECEIVED', false), 'GR_RECEIVED')).toBe(true)
    expect(matchesStatusFilter(job('GR_PACKED', false), 'GR_RECEIVED')).toBe(false)
    expect(matchesStatusFilter(job('CS_OPENED', true), 'CS_OPENED')).toBe(true)
  })

  it('STATUS-03: the virtual filter matches unpaid intake jobs in CS_OPENED and PENDING_VENDOR_ASSIGNMENT', () => {
    expect(matchesStatusFilter(job('CS_OPENED', true), WAITING_INTAKE_PAYMENT)).toBe(true)
    expect(matchesStatusFilter(job('PENDING_VENDOR_ASSIGNMENT', true), WAITING_INTAKE_PAYMENT)).toBe(true)
  })

  it('STATUS-04: the virtual filter excludes paid jobs and jobs past the intake stages', () => {
    expect(matchesStatusFilter(job('CS_OPENED', false), WAITING_INTAKE_PAYMENT)).toBe(false)
    expect(matchesStatusFilter(job('GR_RECEIVED', true), WAITING_INTAKE_PAYMENT)).toBe(false)
    expect(matchesStatusFilter(job('CANCELLED', true), WAITING_INTAKE_PAYMENT)).toBe(false)
  })

  it('STATUS-05: table and badge share one rule — isWaitingIntakePayment drives the label', () => {
    expect(isWaitingIntakePayment(job('CS_OPENED', true))).toBe(true)
    expect(isWaitingIntakePayment(job('PENDING_VENDOR_ASSIGNMENT', true))).toBe(true)
    expect(isWaitingIntakePayment(job('CS_OPENED', false))).toBe(false)
    expect(displayStageLabel(job('CS_OPENED', true))).toBe(WAITING_LABEL)
    expect(displayStageLabel(job('PENDING_VENDOR_ASSIGNMENT', true))).toBe(WAITING_LABEL)
  })

  it('STATUS-06: without unpaid intake the normal stage label is shown', () => {
    expect(displayStageLabel(job('CS_OPENED', false))).toBe(STAGE_LABELS.CS_OPENED)
    expect(displayStageLabel(job('REPAIRING', false))).toBe(STAGE_LABELS.REPAIRING)
  })

  it('STATUS-07: dropdown lists "ทุกสถานะ", then the virtual option, then every real stage in order', () => {
    const options = statusFilterOptions()
    expect(options[0]).toEqual({ value: '', label: 'ทุกสถานะ' })
    expect(options[1]).toEqual({ value: WAITING_INTAKE_PAYMENT, label: WAITING_LABEL })
    expect(options.slice(2).map(o => o.value)).toEqual([...STAGE_ORDER])
  })

  it('STATUS-08: the virtual value is not a JobStage, so it can never reach the database enum', () => {
    expect((STAGE_ORDER as string[]).includes(WAITING_INTAKE_PAYMENT)).toBe(false)
  })
})
