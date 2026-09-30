/**
 * Tier 2: Boundary - Production Engine Direct Integration Tests
 * Directly verifies src/lib/fees.ts, src/lib/state-machine.ts, and src/lib/sla-engine.ts
 */

import { describe, it, expect, setTier } from '../../framework/core'
import {
  getSlaStatus,
  calcIntakeFees,
  calcQuoteTotals,
  calcCustomerBalance,
  calcVendorPayout,
  calcBalance,
  calcSlaDeadline,
  getHoursInStep,
} from '../../../src/lib/fees'
import { ActionError } from '../../../src/lib/state-machine'

setTier('Tier 2')

describe('Tier 2: Boundary - Production Engine Direct Integration', () => {
  // ─── 1. getSlaStatus Math & Division-by-Zero Fix ─────────────────────────
  it('ENG-01: getSlaStatus correctly evaluates AT_RISK when remaining < 20% with 0 paused minutes (no division by zero)', () => {
    const now = Date.now()
    const totalDurationMs = 24 * 3600000 // 24 hours total
    const remainingMs = 3 * 3600000      // 3 hours remaining (12.5% < 20%)

    const clock = {
      status: 'RUNNING',
      startedAt: new Date(now - (totalDurationMs - remainingMs)),
      dueAt: new Date(now + remainingMs),
      pausedMinutes: 0,
    }

    const status = getSlaStatus(clock)
    expect(status).toBe('AT_RISK')
  })

  it('ENG-02: getSlaStatus evaluates ON_TRACK when remaining >= 20% with 0 paused minutes', () => {
    const now = Date.now()
    const totalDurationMs = 24 * 3600000 // 24 hours total
    const remainingMs = 12 * 3600000     // 12 hours remaining (50% >= 20%)

    const clock = {
      status: 'RUNNING',
      startedAt: new Date(now - (totalDurationMs - remainingMs)),
      dueAt: new Date(now + remainingMs),
      pausedMinutes: 0,
    }

    const status = getSlaStatus(clock)
    expect(status).toBe('ON_TRACK')
  })

  it('ENG-03: getSlaStatus evaluates OVERDUE when now > dueAt', () => {
    const now = Date.now()
    const clock = {
      status: 'RUNNING',
      startedAt: new Date(now - 25 * 3600000),
      dueAt: new Date(now - 1 * 3600000), // 1 hour past due
      pausedMinutes: 0,
    }

    const status = getSlaStatus(clock)
    expect(status).toBe('OVERDUE')
  })

  it('ENG-04: getSlaStatus returns ON_TRACK when status is STOPPED regardless of timestamp', () => {
    const now = Date.now()
    const clock = {
      status: 'STOPPED',
      startedAt: new Date(now - 100 * 3600000),
      dueAt: new Date(now - 50 * 3600000), // passed due date but stopped
      pausedMinutes: 0,
      stoppedAt: new Date(now - 60 * 3600000),
    }

    const status = getSlaStatus(clock)
    expect(status).toBe('ON_TRACK')
  })

  it('ENG-05: getSlaStatus with pausedMinutes shifts total duration correctly', () => {
    const now = Date.now()
    // Original duration was 10h, but paused for 2h (120 min), total duration = 12h
    // Remaining is 2h (2 / 12 = 16.6% < 20% -> AT_RISK)
    const clock = {
      status: 'RUNNING',
      startedAt: new Date(now - 10 * 3600000),
      dueAt: new Date(now + 2 * 3600000),
      pausedMinutes: 120,
    }

    const status = getSlaStatus(clock)
    expect(status).toBe('AT_RISK')
  })

  it('ENG-06: getSlaStatus without startedAt defaults to 24-hour total duration safely', () => {
    const now = Date.now()
    // 2 hours remaining out of default 24h = 8.3% < 20% -> AT_RISK
    const clock = {
      status: 'RUNNING',
      dueAt: new Date(now + 2 * 3600000),
      pausedMinutes: 0,
    }

    const status = getSlaStatus(clock)
    expect(status).toBe('AT_RISK')
  })

  // ─── 2. Satang Integer Math in src/lib/fees.ts ────────────────────────────
  it('ENG-07: calcIntakeFees processes satang rates and handles THB normalization', () => {
    // With standard satang rate (15000 satang = 150 THB, 8000 satang = 80 THB)
    const satangResult = calcIntakeFees({
      jobType: 'CUSTOMER',
      hasWarranty: false,
      shippingMethod: 'EXPRESS',
      feeRate: { operationFee: 15000, shippingFee3pl: 8000 },
    })
    expect(satangResult.operationFee).toBe(15000)
    expect(satangResult.shippingFee).toBe(8000)
    expect(satangResult.total).toBe(23000)

    // With legacy Baht values (< 1000) normalized into satang
    const legacyResult = calcIntakeFees({
      jobType: 'CUSTOMER',
      hasWarranty: false,
      shippingMethod: 'EXPRESS',
      feeRate: { operationFee: 150, shippingFee3pl: 80 },
    })
    expect(legacyResult.operationFee).toBe(15000)
    expect(legacyResult.shippingFee).toBe(8000)
    expect(legacyResult.total).toBe(23000)
  })

  it('ENG-08: calcCustomerBalance computes exact credit and outstanding balance in satang', () => {
    const balance = calcCustomerBalance({
      operationFeePaidSatang: 15000,
      quoteTotalSatang: 53500,
      additionalPaymentsSatang: 20000,
    })
    expect(balance.creditSatang).toBe(15000)
    expect(balance.netPayableSatang).toBe(38500)
    expect(balance.outstandingBalanceSatang).toBe(18500)
  })

  it('ENG-09: calcVendorPayout calculates GP and net payable in satang with rounding', () => {
    const payout = calcVendorPayout({
      subtotalSatang: 50000, // 500 THB repair
      gpPct: 18.0,
      deductionsSatang: 0,
    })
    expect(payout.repairAmountSatang).toBe(50000)
    expect(payout.gpAmountSatang).toBe(9000) // 18% of 50000
    expect(payout.netVendorPayableSatang).toBe(41000)
  })

  it('ENG-10: calcSlaDeadline and getHoursInStep calculate correct elapsed time', () => {
    const start = new Date('2026-09-20T00:00:00Z')
    const deadline = calcSlaDeadline(start, 24)
    expect(deadline.getTime() - start.getTime()).toBe(24 * 3600000)

    const clock = {
      startedAt: start,
      pausedMinutes: 60,
      stoppedAt: new Date(start.getTime() + 5 * 3600000), // 5 hours elapsed - 1 hour paused = 4 hours
    }
    expect(getHoursInStep(clock)).toBe(4)
  })
})
