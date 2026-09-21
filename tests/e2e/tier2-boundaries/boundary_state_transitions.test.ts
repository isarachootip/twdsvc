/**
 * Tier 2: Boundary & Corner Cases - State Machine Transitions & Edge Conditions
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 2')

describe('Tier 2: Boundary - State Machine Transitions & Edge Conditions', () => {
  it('BND-TRN-01: Backwards transition attempt (e.g. GR_PACKED back to CS_OPENED) is rejected', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'GR_PACKED' })
    const res = simulateAction(job, 'gr_receive', grUser, { location: 'A-01-01', photos: ['p.jpg'] })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot gr_receive from GR_PACKED')
  })

  it('BND-TRN-02: Skipping intermediate stages (e.g. CS_OPENED directly to VD_INSPECTING) is rejected', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'CS_OPENED', vendorCenterId: 'vc-001' })
    const res = simulateAction(job, 'vd_receive', vdUser)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot vd_receive from CS_OPENED')
  })

  it('BND-TRN-03: Duplicate action execution (e.g. calling gr_pack twice) fails on second invocation', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'GR_RECEIVED' })
    const firstRes = simulateAction(job, 'gr_pack', grUser, { location: 'A-01-02', photos: ['p.jpg'] })
    expect(firstRes.success).toBe(true)
    const secondRes = simulateAction(firstRes.job!, 'gr_pack', grUser, { location: 'A-01-02', photos: ['p.jpg'] })
    expect(secondRes.success).toBe(false)
    expect(secondRes.error).toContain('Cannot gr_pack from GR_PACKED')
  })

  it('BND-TRN-04: Quotation submission without quote lines is rejected with validation error', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })
    const res = simulateAction(job, 'vd_submit_quote', vdUser, { lines: [] })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Quote lines required')
  })

  it('BND-TRN-05: Quotation with 0 total automatically skips WAITING_APPROVAL and transitions directly to REPAIRING', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })
    const res = simulateAction(job, 'vd_submit_quote', vdUser, {
      lines: [{ unitPriceSatang: 0, quantity: 1 }],
    })
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('REPAIRING')
    expect(res.job?.decision).toBe('AUTO_APPROVED')
  })

  it('BND-TRN-06: Stock job at VD_INSPECTING cannot submit a quote', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })
    const res = simulateAction(stockJob, 'vd_submit_quote', vdUser, {
      lines: [{ unitPriceSatang: 5000, quantity: 1 }],
    })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Stock jobs do not use quotations')
  })

  it('BND-TRN-07: Customer job cannot execute stock repair start action', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const customerJob = createMockJob({ type: 'CUSTOMER', stage: 'VD_INSPECTING', vendorCenterId: 'vc-001' })
    const res = simulateAction(customerJob, 'vd_start_repair', vdUser)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Only stock jobs start repair directly')
  })

  it('BND-TRN-08: Action dc_receive_outbound is only permitted for jobs with channel=DC', () => {
    const dcUser = createMockUser({ role: 'DC' })
    const dsdJob = createMockJob({ stage: 'OUTBOUND_TO_VD', channel: 'DSD' })
    const res = simulateAction(dsdJob, 'dc_receive_outbound', dcUser, { location: 'DC-01-A' })
    expect(res.success).toBe(false) // DSD bypasses DC
  })

  it('BND-TRN-09: Action gr_handoff sets destination OUTBOUND_TO_DC for DC channel and OUTBOUND_TO_VD for DSD', () => {
    const grUser = createMockUser({ role: 'GR' })
    const dcJob = createMockJob({ stage: 'GR_PACKED', channel: 'DC' })
    const dsdJob = createMockJob({ stage: 'GR_PACKED', channel: 'DSD' })

    const resDC = simulateAction(dcJob, 'gr_handoff', grUser, { photos: ['h.jpg'] })
    expect(resDC.job?.stage).toBe('OUTBOUND_TO_DC')

    const resDSD = simulateAction(dsdJob, 'gr_handoff', grUser, { photos: ['h.jpg'] })
    expect(resDSD.job?.stage).toBe('OUTBOUND_TO_VD')
  })

  it('BND-TRN-10: Action vd_return_pack routes to INBOUND_TO_DC for DC channel and INBOUND_TO_BRANCH for DSD/TPL', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const dcJob = createMockJob({ stage: 'RETURN_PACKING', vendorCenterId: 'vc-001', channel: 'DC' })
    const dsdJob = createMockJob({ stage: 'RETURN_PACKING', vendorCenterId: 'vc-001', channel: 'DSD' })

    const resDC = simulateAction(dcJob, 'vd_return_pack', vdUser, { photos: ['p.jpg'] })
    expect(resDC.job?.stage).toBe('INBOUND_TO_DC')

    const resDSD = simulateAction(dsdJob, 'vd_return_pack', vdUser, { photos: ['p.jpg'] })
    expect(resDSD.job?.stage).toBe('INBOUND_TO_BRANCH')
  })

  it('BND-TRN-11: Attempting to close customer job with decision APPROVED when balance is unpaid is rejected', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      decision: 'APPROVED',
      charges: [{ type: 'REPAIR', amountSatang: 50000 }],
      payments: [],
    })
    const res = simulateAction(job, 'cs_close', csUser)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Outstanding balance')
  })

  it('BND-TRN-12: Closing customer job with decision REJECTED does not require repair payment', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      decision: 'REJECTED',
    })
    const res = simulateAction(job, 'cs_close', csUser)
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('CLOSED_NOT_REPAIRED')
  })

  it('BND-TRN-13: Stock job close is rejected if attempted by CS role (must be S2 or GR)', () => {
    const csUser = createMockUser({ role: 'CS' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'READY_FOR_PICKUP' })
    const res = simulateAction(stockJob, 'cs_close', csUser)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Stock jobs must be closed by S2 or GR')
  })

  it('BND-TRN-14: Stock job close succeeds when executed by S2 role', () => {
    const s2User = createMockUser({ role: 'S2' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'READY_FOR_PICKUP' })
    const res = simulateAction(stockJob, 'cs_close', s2User)
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('CLOSED_REPAIRED')
  })

  it('BND-TRN-15: Stock job close succeeds when executed by GR role', () => {
    const grUser = createMockUser({ role: 'GR' })
    const stockJob = createMockJob({ type: 'STOCK', stage: 'READY_FOR_PICKUP' })
    const res = simulateAction(stockJob, 'cs_close', grUser)
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('CLOSED_REPAIRED')
  })

  it('BND-TRN-16: Cancelling job at CS_OPENED stage by CS user succeeds', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'CS_OPENED' })
    const res = simulateAction(job, 'cancel', csUser, { reason: 'Customer cancellation' })
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('CANCELLED')
  })

  it('BND-TRN-17: Cancelling job at PENDING_VENDOR_ASSIGNMENT by CS user succeeds', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'PENDING_VENDOR_ASSIGNMENT' })
    const res = simulateAction(job, 'cancel', csUser, { reason: 'Unserviceable brand' })
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('CANCELLED')
  })

  it('BND-TRN-18: Non-admin user cannot assign vendor center to pending jobs', () => {
    const csUser = createMockUser({ role: 'CS' })
    const pendingJob = createMockJob({ stage: 'PENDING_VENDOR_ASSIGNMENT' })
    const res = simulateAction(pendingJob, 'assign_vendor', csUser, { vendorCenterId: 'vc-1' })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Only ADMIN can assign vendor')
  })

  it('BND-TRN-19: Admin assign vendor transitions PENDING_VENDOR_ASSIGNMENT to CS_OPENED', () => {
    const adminUser = createMockUser({ role: 'ADMIN' })
    const pendingJob = createMockJob({ stage: 'PENDING_VENDOR_ASSIGNMENT' })
    const res = simulateAction(pendingJob, 'assign_vendor', adminUser, {
      vendorCenterId: 'vc-expert',
      channel: 'DC',
    })
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('CS_OPENED')
    expect(res.job?.vendorCenterId).toBe('vc-expert')
  })

  it('BND-TRN-20: Missing photos on required transitions (gr_pack, handoff, return) blocks progression', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'GR_RECEIVED' })
    const res = simulateAction(job, 'gr_pack', grUser, { location: 'A-01-01', photos: [] })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Photo is required')
  })
})
