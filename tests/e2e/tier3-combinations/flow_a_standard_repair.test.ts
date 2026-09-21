/**
 * Tier 3: Cross-Feature Combinations - Flow A (Standard Repair Lifecycle)
 * CS Intake -> GR Inbound -> DC Transfer -> VD Repair -> Quote Approved -> Payment -> GR Return -> CS Pickup
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 3')

describe('Tier 3: Flow A - Complete End-to-End Repair Lifecycle (Channel: DC)', () => {
  it('FLOW-A-01: Step 1 - CS Intake creates job, calculates non-warranty operation fee, and records payment', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'BKK-01' })
    const job = createMockJob({
      stage: 'CS_OPENED',
      hasWarranty: false,
      shippingMethod: 'STANDARD',
      sizeCategory: 'SMALL',
      branchId: 'BKK-01',
      channel: 'DC',
    })
    expect(job.charges[0].amountSatang).toBe(15000) // ฿150.00 intake fee

    // Customer pays intake fee via QR code
    const payRes = simulateAction(job, 'record_intake_payment', csUser, {
      amountSatang: 15000,
      paymentMethod: 'PROMPTPAY_QR',
    })
    expect(payRes.success).toBe(true)
    expect(payRes.job?.payments[0].status).toBe('PAID')
  })

  it('FLOW-A-02: Step 2 - GR Receives item, validates location A-01-01, and packs item into A-01-02', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const job = createMockJob({
      stage: 'CS_OPENED',
      branchId: 'BKK-01',
      channel: 'DC',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 15000 }],
      payments: [{ amountSatang: 15000, status: 'PAID', method: 'PROMPTPAY_QR' }],
    })

    // GR receive
    const recRes = simulateAction(job, 'gr_receive', grUser, { location: 'A-01-01', photos: ['receive.jpg'] })
    expect(recRes.success).toBe(true)
    expect(recRes.job?.stage).toBe('GR_RECEIVED')

    // GR pack
    const packRes = simulateAction(recRes.job!, 'gr_pack', grUser, { location: 'A-01-02', photos: ['pack.jpg'] })
    expect(packRes.success).toBe(true)
    expect(packRes.job?.stage).toBe('GR_PACKED')
  })

  it('FLOW-A-03: Step 3 - DC Dispatches vehicle, GR hands off to carrier, transitioning to OUTBOUND_TO_DC', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const job = createMockJob({ stage: 'GR_PACKED', branchId: 'BKK-01', channel: 'DC' })

    const dispRes = simulateAction(job, 'dispatch_pickup', dcUser, { method: 'PRINT' })
    expect(dispRes.success).toBe(true)

    const handRes = simulateAction(job, 'gr_handoff', grUser, { photos: ['carrier_handoff.jpg'] })
    expect(handRes.success).toBe(true)
    expect(handRes.job?.stage).toBe('OUTBOUND_TO_DC')
  })

  it('FLOW-A-04: Step 4 - DC receives at warehouse (DC-01-A) and hands off to Vendor technician', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const job = createMockJob({ stage: 'OUTBOUND_TO_DC', channel: 'DC' })

    const recRes = simulateAction(job, 'dc_receive_outbound', dcUser, { location: 'DC-01-A' })
    expect(recRes.success).toBe(true)
    expect(recRes.job?.stage).toBe('AT_DC_OUTBOUND')

    const handRes = simulateAction(recRes.job!, 'dc_handoff_vd', dcUser, { photos: ['vd_truck.jpg'] })
    expect(handRes.success).toBe(true)
    expect(handRes.job?.stage).toBe('OUTBOUND_TO_VD')
  })

  it('FLOW-A-05: Step 5 - VD receives item, inspects, and submits quotation', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'OUTBOUND_TO_VD', vendorCenterId: 'vc-001' })

    const recRes = simulateAction(job, 'vd_receive', vdUser)
    expect(recRes.success).toBe(true)
    expect(recRes.job?.stage).toBe('VD_INSPECTING')

    // Quote: Parts ฿1,000 + Labor ฿500 = ฿1,500 (150,000 satang)
    // VAT 7% = 10,500 satang. Total: 160,500 satang (1,605.00 THB)
    const quoteRes = simulateAction(recRes.job!, 'vd_submit_quote', vdUser, {
      lines: [
        { unitPriceSatang: 100000, quantity: 1 },
        { unitPriceSatang: 50000, quantity: 1 },
      ],
      repairDays: 5,
    })
    expect(quoteRes.success).toBe(true)
    expect(quoteRes.job?.stage).toBe('WAITING_APPROVAL')
    const quoteToken = quoteRes.job?.tokens.find((t) => t.type === 'QUOTE')
    expect(quoteToken).toBeDefined()
  })

  it('FLOW-A-06: Step 6 - Customer approves quote via portal; operation fee credit (-฿150) is applied', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'WAITING_APPROVAL',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 15000 }],
      quotes: [{ version: 1, subtotalSatang: 150000, vatSatang: 10500, totalSatang: 160500, status: 'SENT' }],
    })
    const appRes = simulateAction(job, 'customer_approve', csUser, { decision: 'approve' })
    expect(appRes.success).toBe(true)
    expect(appRes.job?.stage).toBe('REPAIRING')
    expect(appRes.job?.decision).toBe('APPROVED')

    const repairCharge = appRes.job?.charges.find((c) => c.type === 'REPAIR')
    const creditCharge = appRes.job?.charges.find((c) => c.type === 'OPERATION_FEE_CREDIT')
    expect(repairCharge?.amountSatang).toBe(160500)
    expect(creditCharge?.amountSatang).toBe(-15000)
  })

  it('FLOW-A-07: Step 7 - VD completes repair, packs item for return to DC', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'REPAIRING', vendorCenterId: 'vc-001', channel: 'DC' })

    const finRes = simulateAction(job, 'vd_finish_repair', vdUser)
    expect(finRes.success).toBe(true)
    expect(finRes.job?.stage).toBe('RETURN_PACKING')

    const packRes = simulateAction(finRes.job!, 'vd_return_pack', vdUser, { photos: ['vd_packed.jpg'] })
    expect(packRes.success).toBe(true)
    expect(packRes.job?.stage).toBe('INBOUND_TO_DC')
  })

  it('FLOW-A-08: Step 8 - DC receives return item and dispatches back to Branch', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const job = createMockJob({ stage: 'INBOUND_TO_DC', channel: 'DC' })

    const recRes = simulateAction(job, 'dc_receive_inbound', dcUser, { photos: ['dc_return.jpg'] })
    expect(recRes.success).toBe(true)
    expect(recRes.job?.stage).toBe('AT_DC_INBOUND')

    const dispRes = simulateAction(recRes.job!, 'dc_dispatch_confirm', dcUser)
    expect(dispRes.success).toBe(true)
    expect(dispRes.job?.stage).toBe('INBOUND_TO_BRANCH')
  })

  it('FLOW-A-09: Step 9 - GR receives return (R-01-01) and transfers to front-desk CS', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const job = createMockJob({ stage: 'INBOUND_TO_BRANCH', branchId: 'BKK-01' })

    const recRes = simulateAction(job, 'gr_receive_return', grUser, { location: 'R-01-01', photos: ['gr_ret.jpg'] })
    expect(recRes.success).toBe(true)
    expect(recRes.job?.stage).toBe('GR_RETURN_RECEIVED')

    const delivRes = simulateAction(recRes.job!, 'gr_deliver_cs', grUser, { photos: ['to_cs.jpg'] })
    expect(delivRes.success).toBe(true)
    expect(delivRes.job?.stage).toBe('READY_FOR_PICKUP')
  })

  it('FLOW-A-10: Step 10 - Customer collects repaired item, pays remaining balance ฿1,455, and job closes as CLOSED_REPAIRED', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'BKK-01' })
    // Total repair 160,500 - 15,000 opFee credit = 145,500 satang (1,455.00 THB)
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      branchId: 'BKK-01',
      decision: 'APPROVED',
      charges: [
        { type: 'REPAIR', amountSatang: 160500 },
        { type: 'OPERATION_FEE_CREDIT', amountSatang: -15000 },
      ],
      payments: [],
    })

    // Pay remaining balance
    const payRes = simulateAction(job, 'record_repair_payment', csUser, {
      amountSatang: 145500,
      paymentMethod: 'PROMPTPAY_QR',
    })
    expect(payRes.success).toBe(true)

    // Close job
    const closeRes = simulateAction(payRes.job!, 'cs_close', csUser)
    expect(closeRes.success).toBe(true)
    expect(closeRes.job?.stage).toBe('CLOSED_REPAIRED')
    expect(closeRes.job?.closedAt).toBeDefined()
    const csatToken = closeRes.job?.tokens.find((t) => t.type === 'CSAT')
    expect(csatToken).toBeDefined()
  })
})
