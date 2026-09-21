/**
 * Tier 4: Real-World Application Scenario 2
 * Non-warranty lawnmower out-of-stock parts delay (pause/resume SLA) and customer approved quote
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 4')

describe('Tier 4: Scenario 2 - Non-Warranty Lawnmower Out-of-Stock Parts Delay (Pause/Resume SLA)', () => {
  it('SCN-02-A: Customer brings in large gasoline lawnmower out of warranty; operation fee ฿300 is charged and paid', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'BKK-02' })
    const fees = SPEC_ORACLE.calcIntakeFees({
      jobType: 'CUSTOMER',
      hasWarranty: false,
      shippingMethod: 'STANDARD',
      size: 'LARGE',
    })
    expect(fees.operationFeeSatang).toBe(30000)

    const job = createMockJob({
      stage: 'CS_OPENED',
      branchId: 'BKK-02',
      productName: 'Honda HRJ216 Self-Propelled Gasoline Lawnmower',
      brandName: 'HONDA',
      hasWarranty: false,
      sizeCategory: 'LARGE',
      channel: 'DC',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 30000 }],
      payments: [{ amountSatang: 30000, status: 'PAID', method: 'POS_RECEIPT' }],
    })
    expect(job.charges[0].amountSatang).toBe(30000)
    expect(job.payments[0].status).toBe('PAID')
  })

  it('SCN-02-B: Lawnmower transfers via DC central warehouse to Honda Power Products Service Center', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-02' })
    const dcUser = createMockUser({ role: 'DC' })
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-honda' })

    const job = createMockJob({
      stage: 'CS_OPENED',
      branchId: 'BKK-02',
      vendorCenterId: 'vc-honda',
      channel: 'DC',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 30000 }],
      payments: [{ amountSatang: 30000, status: 'PAID', method: 'POS_RECEIPT' }],
    })

    const grRec = simulateAction(job, 'gr_receive', grUser, { location: 'B-01-01', photos: ['mower.jpg'] })
    const grPack = simulateAction(grRec.job!, 'gr_pack', grUser, { location: 'B-01-02', photos: ['pallet.jpg'] })
    const dcDisp = simulateAction(grPack.job!, 'dispatch_pickup', dcUser, { method: 'PRINT' })
    const grHand = simulateAction(grPack.job!, 'gr_handoff', grUser, { photos: ['dc_load.jpg'] })
    expect(grHand.job?.stage).toBe('OUTBOUND_TO_DC')

    const dcRec = simulateAction(grHand.job!, 'dc_receive_outbound', dcUser, { location: 'DC-04-C' })
    const dcHand = simulateAction(dcRec.job!, 'dc_handoff_vd', dcUser, { photos: ['honda_pickup.jpg'] })
    const vdRec = simulateAction(dcHand.job!, 'vd_receive', vdUser)
    expect(vdRec.job?.stage).toBe('VD_INSPECTING')
  })

  it('SCN-02-C: Honda technician quotes carburetor replacement ฿2,500 + labor ฿800 + 7% VAT', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-honda' })
    const job = createMockJob({ stage: 'VD_INSPECTING', vendorCenterId: 'vc-honda' })

    // Subtotal = ฿3,300 (330,000 satang)
    // 7% VAT = 23,100 satang. Total = 353,100 satang (3,531.00 THB)
    const quoteRes = simulateAction(job, 'vd_submit_quote', vdUser, {
      lines: [
        { unitPriceSatang: 250000, quantity: 1, partWaitDays: 4 },
        { unitPriceSatang: 80000, quantity: 1 },
      ],
      repairDays: 2,
    })
    expect(quoteRes.success).toBe(true)
    expect(quoteRes.job?.stage).toBe('WAITING_APPROVAL')
    const quote = quoteRes.job?.quotes[0]
    expect(quote?.totalSatang).toBe(353100)
  })

  it('SCN-02-D: Customer receives LON message and approves quotation on mobile browser /q/[token]', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'WAITING_APPROVAL',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 30000 }],
      quotes: [{ version: 1, subtotalSatang: 330000, vatSatang: 23100, totalSatang: 353100, status: 'SENT' }],
    })
    const appRes = simulateAction(job, 'customer_approve', csUser, { decision: 'approve' })
    expect(appRes.success).toBe(true)
    expect(appRes.job?.stage).toBe('REPAIRING')

    // Verify ฿300 operation fee credit was created
    const credit = appRes.job?.charges.find((c) => c.type === 'OPERATION_FEE_CREDIT')
    expect(credit?.amountSatang).toBe(-30000)
  })

  it('SCN-02-E: Carburetor is backordered from Japan; technician pauses SLA clock for 4 days (5,760 minutes)', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-honda' })
    const now = new Date()
    const targetDue = new Date(now.getTime() + 168 * 3600000) // 7 days original due
    const job = createMockJob({
      stage: 'REPAIRING',
      vendorCenterId: 'vc-honda',
      slaClocks: [
        {
          stepCode: 'VD_REPAIR',
          status: 'RUNNING',
          startedAt: now,
          dueAt: targetDue,
          pausedMinutes: 0,
          stoppedAt: null,
        },
      ],
    })

    // Pause
    const pauseRes = simulateAction(job, 'vd_pause_parts', vdUser)
    expect(pauseRes.success).toBe(true)
    const pClock = pauseRes.job?.slaClocks.find((c) => c.stepCode === 'VD_REPAIR')
    expect(pClock?.status).toBe('PAUSED')

    // Resume after 4 days (345,600,000 ms = 5,760 min)
    const fourDaysMs = 4 * 24 * 3600000
    const resumeRes = simulateAction(pauseRes.job!, 'vd_resume_parts', vdUser, { pauseDurationMs: fourDaysMs })
    expect(resumeRes.success).toBe(true)
    const rClock = resumeRes.job?.slaClocks.find((c) => c.stepCode === 'VD_REPAIR')
    expect(rClock?.status).toBe('RUNNING')
    expect(rClock?.pausedMinutes).toBe(5760)
    // Target dueAt shifted forward by exactly 4 days
    expect(rClock?.dueAt.getTime()).toBe(targetDue.getTime() + fourDaysMs)
  })

  it('SCN-02-F: Technician finishes engine rebuild, tunes carburetor, and dispatches return to DC', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-honda' })
    const job = createMockJob({ stage: 'REPAIRING', vendorCenterId: 'vc-honda', channel: 'DC' })

    const finRes = simulateAction(job, 'vd_finish_repair', vdUser)
    const packRes = simulateAction(finRes.job!, 'vd_return_pack', vdUser, { photos: ['repaired_mower.jpg'] })
    expect(packRes.job?.stage).toBe('INBOUND_TO_DC')
  })

  it('SCN-02-G: Lawnmower arrives at branch CS counter; customer settles net balance ฿3,231 and receives machine', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'BKK-02' })
    // Repair 353,100 satang - 30,000 satang opFee credit = 323,100 satang (3,231.00 THB)
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      branchId: 'BKK-02',
      decision: 'APPROVED',
      charges: [
        { type: 'REPAIR', amountSatang: 353100 },
        { type: 'OPERATION_FEE_CREDIT', amountSatang: -30000 },
      ],
      payments: [],
    })

    const settlement = SPEC_ORACLE.calcCustomerBalance({
      operationFeePaidSatang: 30000,
      quoteTotalSatang: 353100,
      additionalPaymentsSatang: 0,
    })
    expect(settlement.outstandingBalanceSatang).toBe(323100)

    // Customer pays ฿3,231 via Credit Card link
    const payRes = simulateAction(job, 'record_repair_payment', csUser, {
      amountSatang: 323100,
      paymentMethod: 'CARD_LINK',
    })
    expect(payRes.success).toBe(true)

    // Close job
    const closeRes = simulateAction(payRes.job!, 'cs_close', csUser)
    expect(closeRes.success).toBe(true)
    expect(closeRes.job?.stage).toBe('CLOSED_REPAIRED')
  })
})
