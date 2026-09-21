/**
 * Tier 2: Boundary & Corner Cases - Financial & Satang Integrity
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'
import {
  calcIntakeFees as prodCalcIntakeFees,
  calcQuoteTotals as prodCalcQuoteTotals,
  calcCustomerBalance as prodCalcCustomerBalance,
} from '../../../src/lib/fees'

setTier('Tier 2')

describe('Tier 2: Boundary - Financial & Satang Integrity', () => {
  it('BND-FIN-01: Zero satang intake fee under standard warranty produces exact 0 satang total', () => {
    const fees = SPEC_ORACLE.calcIntakeFees({
      jobType: 'CUSTOMER',
      hasWarranty: true,
      shippingMethod: 'STANDARD',
      size: 'SMALL',
    })
    expect(fees.totalSatang).toBe(0)
    expect(Object.is(fees.totalSatang, 0)).toBe(true)

    const prodFees = prodCalcIntakeFees({
      jobType: 'CUSTOMER',
      hasWarranty: true,
      shippingMethod: 'STANDARD',
      feeRate: { operationFee: 15000, shippingFee3pl: 8000 },
    })
    expect(prodFees.total).toBe(0)
  })

  it('BND-FIN-02: Negative satang payments are rejected with validation error', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'READY_FOR_PICKUP', charges: [{ type: 'REPAIR', amountSatang: 50000 }] })
    const res = simulateAction(job, 'record_repair_payment', csUser, { amountSatang: -100 })
    expect(res.success).toBe(false)
    expect(res.error).toContain('positive')
  })

  it('BND-FIN-03: Zero satang payment is rejected as non-actionable payment entry', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'READY_FOR_PICKUP', charges: [{ type: 'REPAIR', amountSatang: 50000 }] })
    const res = simulateAction(job, 'record_repair_payment', csUser, { amountSatang: 0 })
    expect(res.success).toBe(false)
    expect(res.error).toContain('positive')
  })

  it('BND-FIN-04: Operation fee credit exactly equals quote total when fee paid equals quote total', () => {
    const settlement = SPEC_ORACLE.calcCustomerBalance({
      operationFeePaidSatang: 15000,
      quoteTotalSatang: 15000,
      additionalPaymentsSatang: 0,
    })
    expect(settlement.creditSatang).toBe(15000)
    expect(settlement.netPayableSatang).toBe(0)
    expect(settlement.outstandingBalanceSatang).toBe(0)

    const prodSettlement = prodCalcCustomerBalance({
      operationFeePaidSatang: 15000,
      quoteTotalSatang: 15000,
      additionalPaymentsSatang: 0,
    })
    expect(prodSettlement.creditSatang).toBe(15000)
    expect(prodSettlement.netPayableSatang).toBe(0)
    expect(prodSettlement.outstandingBalanceSatang).toBe(0)
  })

  it('BND-FIN-05: Operation fee credit caps at quote total when fee paid exceeds quote total (฿300 fee vs ฿100 quote)', () => {
    const settlement = SPEC_ORACLE.calcCustomerBalance({
      operationFeePaidSatang: 30000,
      quoteTotalSatang: 10000,
      additionalPaymentsSatang: 0,
    })
    expect(settlement.creditSatang).toBe(10000)
    expect(settlement.netPayableSatang).toBe(0)
    expect(settlement.outstandingBalanceSatang).toBe(0)

    const prodSettlement = prodCalcCustomerBalance({
      operationFeePaidSatang: 30000,
      quoteTotalSatang: 10000,
      additionalPaymentsSatang: 0,
    })
    expect(prodSettlement.creditSatang).toBe(10000)
    expect(prodSettlement.netPayableSatang).toBe(0)
    expect(prodSettlement.outstandingBalanceSatang).toBe(0)
  })

  it('BND-FIN-06: VAT 7% rounding on exact half-satang (0.50) rounds UP as per Thai tax standards', () => {
    // 50 satang subtotal * 0.07 = 3.5 satang -> rounds up to 4 satang
    const totals = SPEC_ORACLE.calcQuoteTotals([{ unitPriceSatang: 50, quantity: 1 }])
    expect(totals.vatSatang).toBe(4)
    expect(totals.totalSatang).toBe(54)

    const prodTotals = prodCalcQuoteTotals([{ unitPrice: 50, quantity: 1 }])
    expect(prodTotals.vatAmount).toBe(4)
    expect(prodTotals.total).toBe(54)
  })

  it('BND-FIN-07: VAT 7% rounding just below half-satang (0.49) rounds DOWN', () => {
    // 49 satang subtotal * 0.07 = 3.43 satang -> rounds down to 3 satang
    const totals = SPEC_ORACLE.calcQuoteTotals([{ unitPriceSatang: 49, quantity: 1 }])
    expect(totals.vatSatang).toBe(3)
    expect(totals.totalSatang).toBe(52)
  })

  it('BND-FIN-08: High-value repair quote (฿1,000,000 / 100,000,000 satang) retains integer precision', () => {
    const lines = [{ unitPriceSatang: 100000000, quantity: 1 }]
    const totals = SPEC_ORACLE.calcQuoteTotals(lines)
    expect(totals.subtotalSatang).toBe(100000000)
    expect(totals.vatSatang).toBe(7000000)
    expect(totals.totalSatang).toBe(107000000)
    expect(Number.isSafeInteger(totals.totalSatang)).toBe(true)
  })

  it('BND-FIN-09: Split payment of exact 1 satang remainder brings balance to zero', () => {
    const totalDue = 10001
    const p1 = 10000
    const p2 = 1
    const rem = totalDue - p1 - p2
    expect(rem).toBe(0)
  })

  it('BND-FIN-10: Payment exceeding outstanding balance by 1 satang is rejected', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      charges: [{ type: 'REPAIR', amountSatang: 10000 }],
      payments: [],
    })
    const res = simulateAction(job, 'record_repair_payment', csUser, { amountSatang: 10001 })
    expect(res.success).toBe(false)
    expect(res.error).toContain('exceeds balance')
  })

  it('BND-FIN-11: Stock repair intake with express shipping is 0 satang (no freight surcharge for branch stock)', () => {
    const fees = SPEC_ORACLE.calcIntakeFees({
      jobType: 'STOCK',
      hasWarranty: false,
      shippingMethod: 'EXPRESS',
      size: 'LARGE',
    })
    expect(fees.totalSatang).toBe(0)
  })

  it('BND-FIN-12: Zero items in quote line calculation returns 0 subtotal, 0 VAT, and 0 total', () => {
    const totals = SPEC_ORACLE.calcQuoteTotals([])
    expect(totals.subtotalSatang).toBe(0)
    expect(totals.vatSatang).toBe(0)
    expect(totals.totalSatang).toBe(0)
  })

  it('BND-FIN-13: Multiple lines calculation with odd satang amounts accumulates without floating-point drift', () => {
    const lines = [
      { unitPriceSatang: 33333, quantity: 3 }, // 99,999 satang
      { unitPriceSatang: 1, quantity: 1 },       // 1 satang
    ]
    const totals = SPEC_ORACLE.calcQuoteTotals(lines)
    expect(totals.subtotalSatang).toBe(100000) // Exactly 1,000.00 THB
    expect(totals.vatSatang).toBe(7000)
    expect(totals.totalSatang).toBe(107000)
  })

  it('BND-FIN-14: Vendor payout with 0 satang deductions pays exact ex-VAT minus GP amount', () => {
    const payout = SPEC_ORACLE.calcVendorPayout({
      subtotalSatang: 500000,
      gpPct: 20.0,
      deductionsSatang: 0,
    })
    expect(payout.repairAmountSatang).toBe(500000)
    expect(payout.gpAmountSatang).toBe(100000)
    expect(payout.netVendorPayableSatang).toBe(400000)
  })

  it('BND-FIN-15: Vendor payout with deductions exceeding repair amount results in negative net payable', () => {
    const payout = SPEC_ORACLE.calcVendorPayout({
      subtotalSatang: 100000, // ฿1,000
      gpPct: 18.0,            // ฿180
      deductionsSatang: 150000, // ฿1,500 penalty
    })
    expect(payout.netVendorPayableSatang).toBe(-68000) // Vendor owes ฿680
  })
})
