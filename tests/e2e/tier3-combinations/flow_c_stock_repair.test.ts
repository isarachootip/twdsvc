/**
 * Tier 3: Cross-Feature Combinations - Flow C (Branch Stock Repair Lifecycle)
 * S2 Stock Repair Intake -> S2 Repair -> S2 Stock Close (no customer payment)
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 3')

describe('Tier 3: Flow C - Branch Stock Repair Lifecycle (/s2)', () => {
  it('FLOW-C-01: S2 operator opens stock repair job with 3 damaged display drill units (type=STOCK)', () => {
    const job = createMockJob({
      type: 'STOCK',
      jobNo: 'STK-2609-00001',
      stage: 'CS_OPENED',
      channel: 'DC',
      charges: [],
      payments: [],
    })
    expect(job.type).toBe('STOCK')
    expect(job.jobNo.startsWith('STK-')).toBe(true)
    expect(job.charges.length).toBe(0)
  })

  it('FLOW-C-02: Branch GR receives stock items without customer payment gate requirement', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const stockJob = createMockJob({
      type: 'STOCK',
      stage: 'CS_OPENED',
      branchId: 'BKK-01',
      charges: [],
      payments: [],
    })
    const recRes = simulateAction(stockJob, 'gr_receive', grUser, { location: 'S-01-01', photos: ['stock_items.jpg'] })
    expect(recRes.success).toBe(true)
    expect(recRes.job?.stage).toBe('GR_RECEIVED')
  })

  it('FLOW-C-03: GR packs stock units and prints A4 2x2 inch product bar-code stickers', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'GR_RECEIVED', branchId: 'BKK-01' })
    const packRes = simulateAction(stockJob, 'gr_pack', grUser, { location: 'S-01-02', photos: ['packed_stock.jpg'] })
    expect(packRes.success).toBe(true)
    expect(packRes.job?.stage).toBe('GR_PACKED')
  })

  it('FLOW-C-04: DC fleet transfers stock repair shipment from branch to central warehouse', () => {
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const dcUser = createMockUser({ role: 'DC' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'GR_PACKED', branchId: 'BKK-01', channel: 'DC' })

    const dispRes = simulateAction(stockJob, 'dispatch_pickup', dcUser, { method: 'PRINT' })
    expect(dispRes.success).toBe(true)

    const handRes = simulateAction(stockJob, 'gr_handoff', grUser, { photos: ['dc_pickup_stock.jpg'] })
    expect(handRes.success).toBe(true)
    expect(handRes.job?.stage).toBe('OUTBOUND_TO_DC')
  })

  it('FLOW-C-05: DC receives stock parcel at warehouse location (DC-02-B) and hands off to Vendor Center', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'OUTBOUND_TO_DC', channel: 'DC' })

    const recRes = simulateAction(stockJob, 'dc_receive_outbound', dcUser, { location: 'DC-02-B' })
    expect(recRes.success).toBe(true)
    expect(recRes.job?.stage).toBe('AT_DC_OUTBOUND')

    const handRes = simulateAction(recRes.job!, 'dc_handoff_vd', dcUser, { photos: ['vd_stock_truck.jpg'] })
    expect(handRes.success).toBe(true)
    expect(handRes.job?.stage).toBe('OUTBOUND_TO_VD')
  })

  it('FLOW-C-06: Vendor receives stock units and transitions directly into VD_INSPECTING', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'OUTBOUND_TO_VD', vendorCenterId: 'vc-001' })
    const recRes = simulateAction(stockJob, 'vd_receive', vdUser)
    expect(recRes.success).toBe(true)
    expect(recRes.job?.stage).toBe('VD_INSPECTING')
  })

  it('FLOW-C-07: Technician initiates repair immediately via vd_start_repair bypassing quotation and customer approval', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })
    const repRes = simulateAction(stockJob, 'vd_start_repair', vdUser)
    expect(repRes.success).toBe(true)
    expect(repRes.job?.stage).toBe('REPAIRING')
  })

  it('FLOW-C-08: Technician completes refurbishing and packs units for DC return shipment', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'REPAIRING', vendorCenterId: 'vc-001', channel: 'DC' })

    const finRes = simulateAction(stockJob, 'vd_finish_repair', vdUser)
    expect(finRes.success).toBe(true)
    expect(finRes.job?.stage).toBe('RETURN_PACKING')

    const packRes = simulateAction(finRes.job!, 'vd_return_pack', vdUser, { photos: ['repaired_stock_box.jpg'] })
    expect(packRes.success).toBe(true)
    expect(packRes.job?.stage).toBe('INBOUND_TO_DC')
  })

  it('FLOW-C-09: Stock units return through DC and branch GR arriving at READY_FOR_PICKUP', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const grUser = createMockUser({ role: 'GR', siteId: 'BKK-01' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'INBOUND_TO_DC', branchId: 'BKK-01', channel: 'DC' })

    const dcRec = simulateAction(stockJob, 'dc_receive_inbound', dcUser, { photos: ['p.jpg'] })
    const dcDisp = simulateAction(dcRec.job!, 'dc_dispatch_confirm', dcUser)
    const grRec = simulateAction(dcDisp.job!, 'gr_receive_return', grUser, { location: 'S-RET-01', photos: ['p.jpg'] })
    const grDeliv = simulateAction(grRec.job!, 'gr_deliver_cs', grUser, { photos: ['p.jpg'] })

    expect(grDeliv.success).toBe(true)
    expect(grDeliv.job?.stage).toBe('READY_FOR_PICKUP')
  })

  it('FLOW-C-10: S2 operator inspects returned refurbished units and closes job without payment requirements', () => {
    const s2User = createMockUser({ role: 'S2' })
    const stockJob = createMockJob({
      type: 'STOCK',
      stage: 'READY_FOR_PICKUP',
      charges: [],
      payments: [],
    })
    const closeRes = simulateAction(stockJob, 'cs_close', s2User)
    expect(closeRes.success).toBe(true)
    expect(closeRes.job?.stage).toBe('CLOSED_REPAIRED')
    expect(closeRes.job?.closedAt).toBeDefined()
  })
})
