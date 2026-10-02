/**
 * Tier 4: Real-World Application Scenario 1
 * High-value power tool warranty repair with express 3PL courier
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 4')

describe('Tier 4: Scenario 1 - High-Value Power Tool Warranty Repair with Express 3PL Courier', () => {
  it('SCN-01-A: Customer brings in high-end Bosch Demolition Hammer (฿45,000 value) under valid warranty requesting Express 3PL courier', () => {
    // Under warranty + Express courier:
    // Operation fee is waived under warranty (฿0 / 0 satang) + 3PL Express shipping fee (฿80 / 8,000 satang)
    // Total intake due = ฿80.00 (8,000 satang)
    const fees = SPEC_ORACLE.calcIntakeFees({
      jobType: 'CUSTOMER',
      hasWarranty: true,
      shippingMethod: 'EXPRESS',
      size: 'SMALL',
    })
    expect(fees.operationFeeSatang).toBe(0)
    expect(fees.shippingFeeSatang).toBe(8000)
    expect(fees.totalSatang).toBe(8000)

    const job = createMockJob({
      productName: 'Bosch GSH 11 E Demolition Hammer 1500W',
      brandName: 'BOSCH',
      hasWarranty: true,
      shippingMethod: 'EXPRESS',
      channel: 'TPL',
      charges: [
        { type: 'SHIPPING_FEE', amountSatang: 8000 },
      ],
    })
    expect(job.channel).toBe('TPL')
  })

  it('SCN-01-B: Customer settles ฿80 intake fee via PromptPay QR at CS counter', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'BKK-01' })
    const job = createMockJob({
      stage: 'CS_OPENED',
      branchId: 'BKK-01',
      charges: [
        { type: 'SHIPPING_FEE', amountSatang: 8000 },
      ],
      payments: [],
    })
    const payRes = simulateAction(job, 'record_intake_payment', csUser, {
      amountSatang: 8000,
      paymentMethod: 'PROMPTPAY_QR',
    })
    expect(payRes.success).toBe(true)
    expect(payRes.job?.payments.length).toBe(1)
    expect(payRes.job?.payments[0].status).toBe('PAID')
  })

  it('SCN-01-C: GR receives hammer, packs into heavy-duty transit box, and system auto-books Flash Express 3PL', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const job = createMockJob({
      stage: 'CS_OPENED',
      branchId: 'BKK-01',
      channel: 'TPL',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 23000 }],
      payments: [{ amountSatang: 23000, status: 'PAID', method: 'PROMPTPAY_QR' }],
    })
    const recRes = simulateAction(job, 'gr_receive', grUser, { location: 'A-09-01', photos: ['hammer_in.jpg'] })
    expect(recRes.success).toBe(true)

    const packRes = simulateAction(recRes.job!, 'gr_pack', grUser, { location: 'A-09-02', photos: ['box_packed.jpg'] })
    expect(packRes.success).toBe(true)
    expect(packRes.job?.stage).toBe('GR_PACKED')
  })

  it('SCN-01-D: 3PL Courier picks up from branch, directly bypassing central DC, and delivers to Bosch Authorized Service Center', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-bosch' })
    const job = createMockJob({
      stage: 'GR_PACKED',
      branchId: 'BKK-01',
      vendorCenterId: 'vc-bosch',
      channel: 'TPL',
    })

    // GR hands off directly to 3PL driver -> Stage becomes OUTBOUND_TO_VD
    const handRes = simulateAction(job, 'gr_handoff', grUser, { photos: ['tpl_driver_sign.jpg'] })
    expect(handRes.success).toBe(true)
    expect(handRes.job?.stage).toBe('OUTBOUND_TO_VD')

    // 3PL arrives at Bosch Service Center
    const vdRecRes = simulateAction(handRes.job!, 'vd_receive', vdUser)
    expect(vdRecRes.success).toBe(true)
    expect(vdRecRes.job?.stage).toBe('VD_INSPECTING')
  })

  it('SCN-01-E: Technician confirms manufacturing defect covered under warranty; quote total is ฿0 which auto-approves into REPAIRING', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-bosch' })
    const job = createMockJob({ stage: 'VD_INSPECTING', vendorCenterId: 'vc-bosch' })

    const quoteRes = simulateAction(job, 'vd_submit_quote', vdUser, {
      lines: [{ unitPriceSatang: 0, quantity: 1 }], // ฿0 warranty parts & labor
      repairDays: 2,
    })
    expect(quoteRes.success).toBe(true)
    expect(quoteRes.job?.stage).toBe('REPAIRING')
    expect(quoteRes.job?.decision).toBe('AUTO_APPROVED')
  })

  it('SCN-01-F: Bosch technician replaces armature and piston rings, tests under load, and dispatches via express 3PL return', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-bosch' })
    const job = createMockJob({ stage: 'REPAIRING', vendorCenterId: 'vc-bosch', channel: 'TPL' })

    const finRes = simulateAction(job, 'vd_finish_repair', vdUser)
    expect(finRes.success).toBe(true)
    expect(finRes.job?.stage).toBe('RETURN_PACKING')

    // 3PL channel allows return pack without mandatory photo if courier booked
    const packRes = simulateAction(finRes.job!, 'vd_return_pack', vdUser, { photos: [] })
    expect(packRes.success).toBe(true)
    expect(packRes.job?.stage).toBe('INBOUND_TO_BRANCH')
  })

  it('SCN-01-G: Branch GR receives express parcel, delivers to CS counter, and customer collects with ฿0 additional payment', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const csUser = createMockUser({ role: 'CS', siteId: 'BKK-01' })
    const job = createMockJob({
      stage: 'INBOUND_TO_BRANCH',
      branchId: 'BKK-01',
      decision: 'AUTO_APPROVED',
      charges: [],
      payments: [],
    })

    const grRec = simulateAction(job, 'gr_receive_return', grUser, { location: 'R-03-01', photos: ['tpl_box_in.jpg'] })
    const grDel = simulateAction(grRec.job!, 'gr_deliver_cs', grUser, { photos: ['cs_desk.jpg'] })
    expect(grDel.job?.stage).toBe('READY_FOR_PICKUP')

    // Close job
    const closeRes = simulateAction(grDel.job!, 'cs_close', csUser)
    expect(closeRes.success).toBe(true)
    expect(closeRes.job?.stage).toBe('CLOSED_REPAIRED')
  })
})
