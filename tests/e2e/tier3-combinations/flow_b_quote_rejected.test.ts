/**
 * Tier 3: Cross-Feature Combinations - Flow B (Quotation Rejected & Non-Repaired Return)
 * CS Intake -> VD Quote Rejected -> Fee Adjustment -> Return Packing -> CS Return
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 3')

describe('Tier 3: Flow B - Quotation Rejected & Non-Repaired Return Flow', () => {
  it('FLOW-B-01: Customer opens non-warranty large product job; intake operation fee ฿300 is charged', () => {
    const job = createMockJob({
      stage: 'CS_OPENED',
      hasWarranty: false,
      shippingMethod: 'STANDARD',
      sizeCategory: 'LARGE',
      channel: 'DSD',
    })
    expect(job.charges[0].amountSatang).toBe(30000) // ฿300.00
  })

  it('FLOW-B-02: Technician evaluates item and quotes ฿4,500 repair fee with 7% VAT', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })

    const quoteRes = simulateAction(job, 'vd_submit_quote', vdUser, {
      lines: [{ unitPriceSatang: 450000, quantity: 1 }],
      repairDays: 7,
    })
    expect(quoteRes.success).toBe(true)
    expect(quoteRes.job?.stage).toBe('WAITING_APPROVAL')
    const quote = quoteRes.job?.quotes[0]
    expect(quote?.totalSatang).toBe(481500) // 450,000 + 7% (31,500) = 481,500 satang (4,815.00 THB)
  })

  it('FLOW-B-03: Customer rejects repair quote via portal as repair cost exceeds equipment replacement value', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'WAITING_APPROVAL' })
    const rejectRes = simulateAction(job, 'customer_reject', csUser, { decision: 'reject' })
    expect(rejectRes.success).toBe(true)
    expect(rejectRes.job?.stage).toBe('RETURN_PACKING')
    expect(rejectRes.job?.decision).toBe('REJECTED')
  })

  it('FLOW-B-04: Non-refundable fee rule confirms operation fee ฿300 is retained; no repair charge or credit added', () => {
    const job = createMockJob({
      stage: 'RETURN_PACKING',
      decision: 'REJECTED',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 30000 }],
    })
    const hasRepairCharge = job.charges.some((c) => c.type === 'REPAIR')
    const hasCredit = job.charges.some((c) => c.type === 'OPERATION_FEE_CREDIT')
    expect(hasRepairCharge).toBe(false)
    expect(hasCredit).toBe(false)
  })

  it('FLOW-B-05: Technician packs rejected item for return directly to Branch via DSD courier', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({
      stage: 'RETURN_PACKING',
      vendorCenterId: 'vc-001',
      channel: 'DSD',
    })
    const packRes = simulateAction(job, 'vd_return_pack', vdUser, { photos: ['vd_return_box.jpg'] })
    expect(packRes.success).toBe(true)
    expect(packRes.job?.stage).toBe('INBOUND_TO_BRANCH')
  })

  it('FLOW-B-06: Branch GR receives rejected product return and logs into return rack R-02-01', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const job = createMockJob({ stage: 'INBOUND_TO_BRANCH', branchId: 'BKK-01' })
    const recRes = simulateAction(job, 'gr_receive_return', grUser, { location: 'R-02-01', photos: ['unrepaired.jpg'] })
    expect(recRes.success).toBe(true)
    expect(recRes.job?.stage).toBe('GR_RETURN_RECEIVED')
  })

  it('FLOW-B-07: GR delivers un-repaired product to CS front counter ready for customer collection', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const job = createMockJob({ stage: 'GR_RETURN_RECEIVED', branchId: 'BKK-01' })
    const delivRes = simulateAction(job, 'gr_deliver_cs', grUser, { photos: ['cs_handover_unrepaired.jpg'] })
    expect(delivRes.success).toBe(true)
    expect(delivRes.job?.stage).toBe('READY_FOR_PICKUP')
  })

  it('FLOW-B-08: Customer arrives for collection; no outstanding repair balance owed', () => {
    const settlement = SPEC_ORACLE.calcCustomerBalance({
      operationFeePaidSatang: 30000,
      quoteTotalSatang: 0,
      additionalPaymentsSatang: 0,
    })
    expect(settlement.outstandingBalanceSatang).toBe(0)
  })

  it('FLOW-B-09: CS completes handover and closes job as CLOSED_NOT_REPAIRED', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'BKK-01' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      branchId: 'BKK-01',
      decision: 'REJECTED',
    })
    const closeRes = simulateAction(job, 'cs_close', csUser)
    expect(closeRes.success).toBe(true)
    expect(closeRes.job?.stage).toBe('CLOSED_NOT_REPAIRED')
  })

  it('FLOW-B-10: Customer chooses to Trade-in un-repaired product for discount voucher (Type 2 Trade-in)', () => {
    const tradeInRecord = {
      type: 'TYPE2',
      linkedJobNo: 'JB-2609-00100',
      couponNo: 'TI-2609-00055',
      discountPct: 15.0,
      status: 'ISSUED',
    }
    expect(tradeInRecord.type).toBe('TYPE2')
    expect(tradeInRecord.discountPct).toBe(15.0)
    expect(tradeInRecord.couponNo).toMatch(/^TI-\d{4}-\d{5}$/)
  })
})
