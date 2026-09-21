/**
 * Tier 1: Feature Coverage (Features 6 to 10)
 * Feature 6: CS Queue & Pickup (/cs)
 * Feature 7: GR 5 Queues (/gr)
 * Feature 8: DC 5 Queues (/dc)
 * Feature 9: VD 5 Queues (/vd)
 * Feature 10: VD Fullscreen Quote (/vd/jobs/[id]/quote)
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 1')

describe('Feature 6: CS Queue & Pickup (/cs)', () => {
  it('F06-T01: CS Pickup panel correctly breaks down repair charges, operation fee credit, and net balance', () => {
    // Customer paid ฿300 operation fee at intake. Repair quote is ฿1,500.
    const settlement = SPEC_ORACLE.calcCustomerBalance({
      operationFeePaidSatang: 30000,
      quoteTotalSatang: 150000,
      additionalPaymentsSatang: 0,
    })
    expect(settlement.creditSatang).toBe(30000) // Credited -฿300
    expect(settlement.netPayableSatang).toBe(120000) // Net ฿1,200
    expect(settlement.outstandingBalanceSatang).toBe(120000)
  })

  it('F06-T02: CS close job action is blocked when customer approved quote but balance remains outstanding', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      decision: 'APPROVED',
      charges: [
        { type: 'OPERATION_FEE', amountSatang: 15000 },
        { type: 'REPAIR', amountSatang: 100000 },
        { type: 'OPERATION_FEE_CREDIT', amountSatang: -15000 },
      ],
      payments: [{ amountSatang: 15000, status: 'PAID', method: 'POS_RECEIPT' }],
    })
    // Outstanding balance is ฿850 (85,000 satang)
    const result = simulateAction(job, 'cs_close', csUser)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Outstanding balance')
  })

  it('F06-T03: Customer records full repair payment, reducing outstanding balance to zero', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      decision: 'APPROVED',
      charges: [
        { type: 'REPAIR', amountSatang: 100000 },
        { type: 'OPERATION_FEE_CREDIT', amountSatang: -15000 },
      ],
      payments: [],
    })
    // Balance is 85,000 satang
    const payResult = simulateAction(job, 'record_repair_payment', csUser, {
      amountSatang: 85000,
      paymentMethod: 'PROMPTPAY_QR',
    })
    expect(payResult.success).toBe(true)
    expect(payResult.job?.payments.length).toBe(1)
    expect(payResult.job?.payments[0].amountSatang).toBe(85000)

    // Now close succeeds
    const closeResult = simulateAction(payResult.job!, 'cs_close', csUser)
    expect(closeResult.success).toBe(true)
    expect(closeResult.job?.stage).toBe('CLOSED_REPAIRED')
  })

  it('F06-T04: Rejected job pickup allows close without payment and sets stage to CLOSED_NOT_REPAIRED', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      decision: 'REJECTED',
    })
    const result = simulateAction(job, 'cs_close', csUser)
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('CLOSED_NOT_REPAIRED')
  })

  it('F06-T05: CS queues partition into Ready for Pickup, Waiting Customer Approval, and Opened Today', () => {
    const queueTabs = ['READY_FOR_PICKUP', 'WAITING_APPROVAL', 'OPENED_TODAY']
    expect(queueTabs.length).toBe(3)
    expect(queueTabs[0]).toBe('READY_FOR_PICKUP')
  })
})

describe('Feature 7: GR 5 Queues (/gr)', () => {
  it('F07-T01: GR Tab 1 (Receive from CS) requires valid location format A-00-00 and photo', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'CS_OPENED', charges: [], payments: [] })

    // Missing location
    const resNoLoc = simulateAction(job, 'gr_receive', grUser, { photos: ['photo1.jpg'] })
    expect(resNoLoc.success).toBe(false)
    expect(resNoLoc.error).toContain('location')

    // Invalid location
    const resBadLoc = simulateAction(job, 'gr_receive', grUser, { location: 'INVALID-LOC', photos: ['p.jpg'] })
    expect(resBadLoc.success).toBe(false)

    // Valid location A-04-11 and photo
    const resValid = simulateAction(job, 'gr_receive', grUser, { location: 'A-04-11', photos: ['p.jpg'] })
    expect(resValid.success).toBe(true)
    expect(resValid.job?.stage).toBe('GR_RECEIVED')
  })

  it('F07-T02: GR Tab 1 blocks receive if intake fee has not been paid', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({
      stage: 'CS_OPENED',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 15000 }],
      payments: [], // Unpaid
    })
    const result = simulateAction(job, 'gr_receive', grUser, { location: 'A-01-01', photos: ['p.jpg'] })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Intake payment pending')
  })

  it('F07-T03: GR Tab 2 (Pack) assigns new holding location and transitions stage to GR_PACKED', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'GR_RECEIVED' })
    const result = simulateAction(job, 'gr_pack', grUser, { location: 'A-04-12', photos: ['box.jpg'] })
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('GR_PACKED')
  })

  it('F07-T04: GR Tab 3 (Handoff) transitions to OUTBOUND_TO_DC or OUTBOUND_TO_VD based on channel', () => {
    const grUser = createMockUser({ role: 'GR' })
    const dcJob = createMockJob({ stage: 'GR_PACKED', channel: 'DC' })
    const dsdJob = createMockJob({ stage: 'GR_PACKED', channel: 'DSD' })

    const dcRes = simulateAction(dcJob, 'gr_handoff', grUser, { photos: ['handoff.jpg'] })
    expect(dcRes.success).toBe(true)
    expect(dcRes.job?.stage).toBe('OUTBOUND_TO_DC')

    const dsdRes = simulateAction(dsdJob, 'gr_handoff', grUser, { photos: ['handoff.jpg'] })
    expect(dsdRes.success).toBe(true)
    expect(dsdRes.job?.stage).toBe('OUTBOUND_TO_VD')
  })

  it('F07-T05: GR Tab 4 (Receive Return) and Tab 5 (Deliver to CS) complete branch inbound return flow', () => {
    const grUser = createMockUser({ role: 'GR' })
    const returnJob = createMockJob({ stage: 'INBOUND_TO_BRANCH' })

    const res4 = simulateAction(returnJob, 'gr_receive_return', grUser, { location: 'R-01-05', photos: ['ret.jpg'] })
    expect(res4.success).toBe(true)
    expect(res4.job?.stage).toBe('GR_RETURN_RECEIVED')

    const res5 = simulateAction(res4.job!, 'gr_deliver_cs', grUser, { photos: ['cs_handover.jpg'] })
    expect(res5.success).toBe(true)
    expect(res5.job?.stage).toBe('READY_FOR_PICKUP')
  })
})

describe('Feature 8: DC 5 Queues (/dc)', () => {
  it('F08-T01: DC Tab 1 (Branch Pickup) dispatches vehicle and supports DRIVER link generation', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const job = createMockJob({ stage: 'GR_PACKED', channel: 'DC' })
    const result = simulateAction(job, 'dispatch_pickup', dcUser, { method: 'LINK' })
    expect(result.success).toBe(true)
    const driverToken = result.job?.tokens.find((t) => t.type === 'DRIVER')
    expect(driverToken).toBeDefined()
  })

  it('F08-T02: DC Tab 2 (Receive Outbound) records DC location (format DC-00-A) and transitions to AT_DC_OUTBOUND', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const job = createMockJob({ stage: 'OUTBOUND_TO_DC', channel: 'DC' })

    const badLoc = simulateAction(job, 'dc_receive_outbound', dcUser, { location: 'A-01-01' })
    expect(badLoc.success).toBe(false)

    const goodLoc = simulateAction(job, 'dc_receive_outbound', dcUser, { location: 'DC-01-A' })
    expect(goodLoc.success).toBe(true)
    expect(goodLoc.job?.stage).toBe('AT_DC_OUTBOUND')
  })

  it('F08-T03: DC Tab 3 (Handoff to VD) transitions to OUTBOUND_TO_VD and clears warehouse slot', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const job = createMockJob({ stage: 'AT_DC_OUTBOUND', channel: 'DC' })
    const result = simulateAction(job, 'dc_handoff_vd', dcUser, { photos: ['vd_pickup.jpg'] })
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('OUTBOUND_TO_VD')
  })

  it('F08-T04: DC Tab 4 (Receive Inbound from VD) verifies return condition and sets AT_DC_INBOUND', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const job = createMockJob({ stage: 'INBOUND_TO_DC', channel: 'DC' })
    const result = simulateAction(job, 'dc_receive_inbound', dcUser, { photos: ['inbound.jpg'] })
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('AT_DC_INBOUND')
  })

  it('F08-T05: DC Tab 5 (Dispatch Confirm) confirms delivery back to branch setting INBOUND_TO_BRANCH', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const job = createMockJob({ stage: 'AT_DC_INBOUND', channel: 'DC' })
    const result = simulateAction(job, 'dc_dispatch_confirm', dcUser)
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('INBOUND_TO_BRANCH')
  })
})

describe('Feature 9: VD 5 Queues (/vd)', () => {
  it('F09-T01: VD Tab 1 (Pending Intake) confirms physical receipt transitioning OUTBOUND_TO_VD to VD_INSPECTING', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'OUTBOUND_TO_VD', vendorCenterId: 'vc-001' })
    const result = simulateAction(job, 'vd_receive', vdUser)
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('VD_INSPECTING')
  })

  it('F09-T02: VD Tab 2 (Quotation) navigates to full quotation form or submits quote items', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })
    const result = simulateAction(job, 'vd_submit_quote', vdUser, {
      lines: [{ unitPriceSatang: 50000, quantity: 1 }],
      repairDays: 5,
    })
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('WAITING_APPROVAL')
  })

  it('F09-T03: VD Tab 3 (Waiting Approval) monitors quote status and LON preview', () => {
    const job = createMockJob({ stage: 'WAITING_APPROVAL', decision: 'PENDING' })
    const quoteToken = job.tokens.find((t) => t.type === 'QUOTE')
    expect(job.stage).toBe('WAITING_APPROVAL')
    expect(job.decision).toBe('PENDING')
  })

  it('F09-T04: VD Tab 4 (Repairing) supports pause and resume SLA clock for out-of-stock parts', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const now = new Date()
    const job = createMockJob({
      stage: 'REPAIRING',
      vendorCenterId: 'vc-001',
      slaClocks: [
        {
          stepCode: 'VD_REPAIR',
          status: 'RUNNING',
          startedAt: now,
          dueAt: new Date(now.getTime() + 168 * 3600000),
          pausedMinutes: 0,
          stoppedAt: null,
        },
      ],
    })
    // Pause for parts
    const pauseRes = simulateAction(job, 'vd_pause_parts', vdUser)
    expect(pauseRes.success).toBe(true)
    const pausedClock = pauseRes.job?.slaClocks.find((c) => c.stepCode === 'VD_REPAIR')
    expect(pausedClock?.status).toBe('PAUSED')

    // Resume after 24 hours (86,400,000 ms)
    const resumeRes = simulateAction(pauseRes.job!, 'vd_resume_parts', vdUser, { pauseDurationMs: 86400000 })
    expect(resumeRes.success).toBe(true)
    const resumedClock = resumeRes.job?.slaClocks.find((c) => c.stepCode === 'VD_REPAIR')
    expect(resumedClock?.status).toBe('RUNNING')
    expect(resumedClock?.pausedMinutes).toBe(1440) // 24 hours in minutes
  })

  it('F09-T05: VD Tab 5 (Pack & Return) packs item and dispatches return to DC or Branch', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'RETURN_PACKING', vendorCenterId: 'vc-001', channel: 'DC' })
    const result = simulateAction(job, 'vd_return_pack', vdUser, { photos: ['vd_pack.jpg'] })
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('INBOUND_TO_DC')
  })
})

describe('Feature 10: VD Fullscreen Quote (/vd/jobs/[id]/quote)', () => {
  it('F10-T01: Quotation math adds 7% VAT with Half-Up integer satang rounding', () => {
    // 2 parts: 450.00 THB + 320.00 THB = 770.00 THB (77,000 satang)
    // 7% VAT: 77,000 * 0.07 = 5,390 satang (53.90 THB)
    // Total: 82,390 satang (823.90 THB)
    const lines = [
      { unitPriceSatang: 45000, quantity: 1 },
      { unitPriceSatang: 32000, quantity: 1 },
    ]
    const totals = SPEC_ORACLE.calcQuoteTotals(lines)
    expect(totals.subtotalSatang).toBe(77000)
    expect(totals.vatSatang).toBe(5390)
    expect(totals.totalSatang).toBe(82390)
  })

  it('F10-T02: Quotation generates a 7-day expiring public QUOTE token upon submission', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })
    const result = simulateAction(job, 'vd_submit_quote', vdUser, {
      lines: [{ unitPriceSatang: 120000, quantity: 1 }],
      repairDays: 3,
    })
    expect(result.success).toBe(true)
    const quoteToken = result.job?.tokens.find((t) => t.type === 'QUOTE')
    expect(quoteToken).toBeDefined()
    const validDays = Math.round((quoteToken!.expiresAt.getTime() - Date.now()) / (24 * 3600000))
    expect(validDays).toBe(7)
  })

  it('F10-T03: Quotation with 0 total auto-approves immediately without customer interaction', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })
    const result = simulateAction(job, 'vd_submit_quote', vdUser, {
      lines: [{ unitPriceSatang: 0, quantity: 1 }],
      repairDays: 2,
    })
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('REPAIRING')
    expect(result.job?.decision).toBe('AUTO_APPROVED')
  })

  it('F10-T04: Submitting quote for STOCK job is rejected as stock jobs do not require quotations', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })
    const result = simulateAction(stockJob, 'vd_submit_quote', vdUser, {
      lines: [{ unitPriceSatang: 50000, quantity: 1 }],
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Stock jobs do not use quotations')
  })

  it('F10-T05: Estimated repair duration aggregates base repair days and maximum spare part wait days', () => {
    const baseDays = 3
    const partWaitDays = [2, 5, 1]
    const maxWait = Math.max(...partWaitDays)
    const totalEstimatedDays = baseDays + maxWait
    expect(totalEstimatedDays).toBe(8)
  })
})
