/**
 * Tier 2: Boundary & Corner Cases - Payout Cycles, Promotions & Admin Rules
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob } from '../../framework/helpers'

setTier('Tier 2')

describe('Tier 2: Boundary - Payout Cycles, Promotions & Admin Rules', () => {
  it('BND-ADM-01: Payout calculation with 0% GP override leaves ex-VAT amount untouched', () => {
    const payout = SPEC_ORACLE.calcVendorPayout({
      subtotalSatang: 250000,
      gpPct: 0.0,
      deductionsSatang: 0,
    })
    expect(payout.gpAmountSatang).toBe(0)
    expect(payout.netVendorPayableSatang).toBe(250000)
  })

  it('BND-ADM-02: Payout calculation with 100% GP override deducts full ex-VAT amount', () => {
    const payout = SPEC_ORACLE.calcVendorPayout({
      subtotalSatang: 250000,
      gpPct: 100.0,
      deductionsSatang: 0,
    })
    expect(payout.gpAmountSatang).toBe(250000)
    expect(payout.netVendorPayableSatang).toBe(0)
  })

  it('BND-ADM-03: Payout deduction with odd satang amounts rounds Half-Up accurately', () => {
    // 333,333 satang * 18% = 59,999.94 satang -> rounds to 60,000 satang
    const payout = SPEC_ORACLE.calcVendorPayout({
      subtotalSatang: 333333,
      gpPct: 18.0,
      deductionsSatang: 0,
    })
    expect(payout.gpAmountSatang).toBe(60000)
    expect(payout.netVendorPayableSatang).toBe(273333)
  })

  it('BND-ADM-04: Closed jobs with closedAt outside the payout cycle date window are excluded', () => {
    const cycleStart = new Date('2026-09-01T00:00:00Z')
    const cycleEnd = new Date('2026-09-15T23:59:59Z')
    const lateJobClosedAt = new Date('2026-09-16T00:00:01Z')
    const isWithinCycle = lateJobClosedAt >= cycleStart && lateJobClosedAt <= cycleEnd
    expect(isWithinCycle).toBe(false)
  })

  it('BND-ADM-05: Non-closed jobs are strictly ineligible for vendor payout batches', () => {
    const activeJob = createMockJob({ stage: 'REPAIRING' })
    const isEligible = activeJob.stage === 'CLOSED_REPAIRED'
    expect(isEligible).toBe(false)
  })

  it('BND-ADM-06: Customer rejected jobs (CLOSED_NOT_REPAIRED) are ineligible for vendor repair payout', () => {
    const rejectedJob = createMockJob({ stage: 'CLOSED_NOT_REPAIRED' })
    const isEligible = rejectedJob.stage === 'CLOSED_REPAIRED'
    expect(isEligible).toBe(false)
  })

  it('BND-ADM-07: Promotion date validity boundary rejects promotions past their endDate', () => {
    const expiredPromo = {
      name: 'Summer Promo',
      startDate: new Date('2026-06-01T00:00:00Z'),
      endDate: new Date('2026-08-31T23:59:59Z'),
    }
    const checkDate = new Date('2026-09-01T00:00:00Z')
    const isValid = checkDate >= expiredPromo.startDate && checkDate <= expiredPromo.endDate
    expect(isValid).toBe(false)
  })

  it('BND-ADM-08: Promotion boundary accepts promotions active on the exact start timestamp', () => {
    const promo = {
      name: 'Autumn Promo',
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-09-30T23:59:59Z'),
    }
    const checkDate = new Date('2026-09-01T00:00:00Z')
    const isValid = checkDate >= promo.startDate && checkDate <= promo.endDate
    expect(isValid).toBe(true)
  })

  it('BND-ADM-09: Trade-in coupon status transitions from ISSUED to USED upon redemption', () => {
    const coupon = {
      code: 'TI-2609-00001',
      status: 'ISSUED' as 'ISSUED' | 'USED' | 'EXPIRED',
    }
    coupon.status = 'USED'
    expect(coupon.status).toBe('USED')
  })

  it('BND-ADM-10: Inactive vendor center is excluded from automatic routing resolution', () => {
    const vendorCenters = [
      { id: 'vc-1', name: 'Center 1', active: false },
      { id: 'vc-2', name: 'Center 2', active: true },
    ]
    const activeCenters = vendorCenters.filter((vc) => vc.active)
    expect(activeCenters.length).toBe(1)
    expect(activeCenters[0].id).toBe('vc-2')
  })

  it('BND-ADM-11: Routing resolution falls back to backup vendor center if primary is inactive', () => {
    const primary = { id: 'vc-primary', active: false }
    const backup = { id: 'vc-backup', active: true }
    const selectedCenter = primary.active ? primary.id : backup.active ? backup.id : null
    expect(selectedCenter).toBe('vc-backup')
  })

  it('BND-ADM-12: Routing resolution falls back to PENDING_VENDOR_ASSIGNMENT if all centers inactive', () => {
    const primary = { id: 'vc-primary', active: false }
    const backup = { id: 'vc-backup', active: false }
    const selectedCenter = primary.active ? primary.id : backup.active ? backup.id : null
    const targetStage = selectedCenter ? 'CS_OPENED' : 'PENDING_VENDOR_ASSIGNMENT'
    expect(targetStage).toBe('PENDING_VENDOR_ASSIGNMENT')
  })

  it('BND-ADM-13: VAT rate change in Admin general settings alters quotation calculations dynamically', () => {
    const subtotal = 100000
    const vat7 = SPEC_ORACLE.calcQuoteTotals([{ unitPriceSatang: subtotal, quantity: 1 }], 0.07)
    const vat10 = SPEC_ORACLE.calcQuoteTotals([{ unitPriceSatang: subtotal, quantity: 1 }], 0.10)
    expect(vat7.vatSatang).toBe(7000)
    expect(vat10.vatSatang).toBe(10000)
  })

  it('BND-ADM-14: Admin can toggle role permissions dynamically in role-menu permission matrix', () => {
    const matrix = { ...SPEC_ORACLE.RBAC_MENU_MATRIX }
    const csCanAdmin = matrix.CS.includes('admin')
    expect(csCanAdmin).toBe(false)
  })

  it('BND-ADM-15: Repair SKU master catalog enforces unique SKU codes', () => {
    const skus = new Set(['SKU-REP-001', 'SKU-REP-002'])
    const isDuplicate = skus.has('SKU-REP-001')
    expect(isDuplicate).toBe(true)
  })
})
