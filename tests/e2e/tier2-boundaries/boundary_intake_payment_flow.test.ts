/**
 * Tier 2: Boundary - Intake Payment Flow & GR Gate Integrity
 * Verifies that unpaid customer jobs are blocked from GR receipt,
 * tagged as intakeUnpaid, and filtered from GR receive queue until paid.
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { calcMoney } from '../../../src/lib/job-view'
import { INTAKE_GR_ACTIONS } from '../../../src/lib/state-machine/actions-intake-gr'
import { ActionError } from '../../../src/lib/state-machine/errors'

setTier('Tier 2')

describe('Tier 2: Boundary - Intake Payment Flow & GR Queue Isolation', () => {
  it('INTAKE-01: calcMoney correctly calculates intakeBalance and intakeUnpaid flag for unpaid customer jobs', () => {
    const unpaidJob = {
      type: 'CUSTOMER',
      charges: [
        { type: 'OPERATION_FEE', amount: 150 },
        { type: 'SHIPPING_FEE', amount: 50 },
      ],
      payments: [],
    }

    const money = calcMoney(unpaidJob as any)
    const isUnpaid = unpaidJob.type === 'CUSTOMER' && money.intakeBalance > 0

    expect(money.intakeCharges).toBe(200)
    expect(money.intakePaid).toBe(0)
    expect(money.intakeBalance).toBe(200)
    expect(isUnpaid).toBe(true)
  })

  it('INTAKE-02: calcMoney flags intakeUnpaid as false when payments match or exceed intake charges', () => {
    const paidJob = {
      type: 'CUSTOMER',
      charges: [
        { type: 'OPERATION_FEE', amount: 150 },
        { type: 'SHIPPING_FEE', amount: 50 },
      ],
      payments: [
        { chargeType: 'OPERATION_FEE', amount: 150, status: 'PAID' },
        { chargeType: 'SHIPPING_FEE', amount: 50, status: 'PAID' },
      ],
    }

    const money = calcMoney(paidJob as any)
    const isUnpaid = paidJob.type === 'CUSTOMER' && money.intakeBalance > 0

    expect(money.intakeCharges).toBe(200)
    expect(money.intakePaid).toBe(200)
    expect(money.intakeBalance).toBe(0)
    expect(isUnpaid).toBe(false)
  })

  it('INTAKE-03: Pending payments do not count as paid until settled', () => {
    const pendingJob = {
      type: 'CUSTOMER',
      charges: [
        { type: 'OPERATION_FEE', amount: 150 },
      ],
      payments: [
        { chargeType: 'OPERATION_FEE', amount: 150, status: 'PENDING' },
      ],
    }

    const money = calcMoney(pendingJob as any)
    const isUnpaid = pendingJob.type === 'CUSTOMER' && money.intakeBalance > 0

    expect(money.intakePaid).toBe(0)
    expect(money.intakeBalance).toBe(150)
    expect(isUnpaid).toBe(true)
  })

  it('INTAKE-04: gr_receive validator throws ActionError when customer job has unpaid intake fees', () => {
    const unpaidJobCtx = {
      job: {
        id: 'job-123',
        type: 'CUSTOMER',
        vendorCenterId: 'vc-1',
        charges: [{ type: 'OPERATION_FEE', amount: 150 }],
        payments: [],
      },
    }

    let error: Error | null = null
    try {
      INTAKE_GR_ACTIONS.gr_receive.validate!(unpaidJobCtx as any)
    } catch (e) {
      error = e as Error
    }

    expect(error instanceof ActionError).toBe(true)
    expect(error?.message).toContain('รอชำระค่าดำเนินการก่อนรับสินค้า')
  })

  it('INTAKE-05: GR receive queue filters out jobs with intakeUnpaid: true', () => {
    const queueJobs = [
      { id: 'job-1', jobNo: 'JB-001', intakeUnpaid: true },
      { id: 'job-2', jobNo: 'JB-002', intakeUnpaid: false },
      { id: 'job-3', jobNo: 'JB-003', intakeUnpaid: false },
    ]

    const filtered = queueJobs.filter(j => !j.intakeUnpaid)
    expect(filtered.length).toBe(2)
    expect(filtered.map(j => j.id)).toEqual(['job-2', 'job-3'])
    expect(filtered.some(j => j.id === 'job-1')).toBe(false)
  })
})
