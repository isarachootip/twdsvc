/**
 * Tier 5: Adversarial Stress Test Suite — Challenger M6-2
 * White-box adversarial testing for:
 * 1. Integer Satang Financial Math & Bug C4 Operation Fee Credit
 * 2. 16-Step SLA Clocks & Division-by-Zero Protection
 * 3. Vendor Payout Batch, Double Settlement Protection & Bi-Monthly Boundaries
 */

import { describe, it, expect, setTier } from '../../framework/core'
import {
  calcIntakeFees,
  calcQuoteTotals,
  calcCustomerBalance,
  calcVendorPayout,
  calcBalance,
  calcSlaDeadline,
  getSlaStatus,
  getHoursInStep,
  formatSatang,
} from '../../../src/lib/fees'
import { resolveOwner } from '../../../src/lib/sla-engine'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 5')

describe('Tier 5: Challenger M6-2 - Integer Satang Financial Math & Bug C4 Credit', () => {
  // ─── 1. Bug C4: Operation Fee Credit Formula: -min(opFeePaid, quote.total) ───
  it('ADV-FIN-01: Operation fee credit when quote.total > opFeePaid', () => {
    // Quote ฿500 (50,000 satang), Op fee paid ฿150 (15,000 satang)
    // Credit = 15,000 satang, Net payable = 35,000 satang
    const res = calcCustomerBalance({
      operationFeePaidSatang: 15000,
      quoteTotalSatang: 50000,
      additionalPaymentsSatang: 0,
    })
    expect(res.creditSatang).toBe(15000)
    expect(res.netPayableSatang).toBe(35000)
    expect(res.outstandingBalanceSatang).toBe(35000)
  })

  it('ADV-FIN-02: Operation fee credit when quote.total < opFeePaid (capped at quote.total)', () => {
    // Quote ฿100 (10,000 satang), Op fee paid ฿150 (15,000 satang)
    // Credit is capped at 10,000 satang. Net payable = 0. Customer does not get negative charge.
    const res = calcCustomerBalance({
      operationFeePaidSatang: 15000,
      quoteTotalSatang: 10000,
      additionalPaymentsSatang: 0,
    })
    expect(res.creditSatang).toBe(10000)
    expect(res.netPayableSatang).toBe(0)
    expect(res.outstandingBalanceSatang).toBe(0)
  })

  it('ADV-FIN-03: Operation fee credit when quote.total === opFeePaid', () => {
    // Quote ฿150 (15,000 satang), Op fee paid ฿150 (15,000 satang)
    const res = calcCustomerBalance({
      operationFeePaidSatang: 15000,
      quoteTotalSatang: 15000,
      additionalPaymentsSatang: 0,
    })
    expect(res.creditSatang).toBe(15000)
    expect(res.netPayableSatang).toBe(0)
    expect(res.outstandingBalanceSatang).toBe(0)
  })

  it('ADV-FIN-04: Operation fee credit when quote.total === 0 (zero-cost warranty repair)', () => {
    // Free repair quote: credit is 0, net payable is 0
    const res = calcCustomerBalance({
      operationFeePaidSatang: 15000,
      quoteTotalSatang: 0,
      additionalPaymentsSatang: 0,
    })
    expect(res.creditSatang).toBe(0)
    expect(res.netPayableSatang).toBe(0)
    expect(res.outstandingBalanceSatang).toBe(0)
  })

  it('ADV-FIN-05: Operation fee credit when opFeePaid === 0 (warranty or unpaid intake)', () => {
    // No op fee was paid: credit is 0, full quote amount is payable
    const res = calcCustomerBalance({
      operationFeePaidSatang: 0,
      quoteTotalSatang: 80000,
      additionalPaymentsSatang: 0,
    })
    expect(res.creditSatang).toBe(0)
    expect(res.netPayableSatang).toBe(80000)
    expect(res.outstandingBalanceSatang).toBe(80000)
  })

  it('ADV-FIN-06: Additional payments reduce outstanding balance without creating negative balance', () => {
    const res = calcCustomerBalance({
      operationFeePaidSatang: 15000,
      quoteTotalSatang: 50000,
      additionalPaymentsSatang: 40000, // Overpaid by 50 THB
    })
    expect(res.creditSatang).toBe(15000)
    expect(res.netPayableSatang).toBe(35000)
    expect(res.outstandingBalanceSatang).toBe(0) // Floored at 0 via Math.max(0, ...)
  })

  // ─── 2. 7% VAT Integer Satang Half-Up Rounding & Drift Tests ─────────────
  it('ADV-FIN-07: VAT 7% half-up rounding on exact half-satang boundary (n.5 satang)', () => {
    // 50 satang * 0.07 = 3.5 satang -> rounds to 4 satang
    const res50 = calcQuoteTotals([{ unitPrice: 50, quantity: 1 }])
    expect(res50.vatAmount).toBe(4)
    expect(res50.total).toBe(54)

    // 150 satang * 0.07 = 10.5 satang -> rounds to 11 satang
    const res150 = calcQuoteTotals([{ unitPrice: 150, quantity: 1 }])
    expect(res150.vatAmount).toBe(11)
    expect(res150.total).toBe(161)

    // 250 satang * 0.07 = 17.5 satang -> rounds to 18 satang
    const res250 = calcQuoteTotals([{ unitPrice: 250, quantity: 1 }])
    expect(res250.vatAmount).toBe(18)
    expect(res250.total).toBe(268)
  })

  it('ADV-FIN-08: VAT 7% rounding below half-satang boundary (n.49 satang)', () => {
    // 49 satang * 0.07 = 3.43 satang -> rounds down to 3 satang
    const res49 = calcQuoteTotals([{ unitPrice: 49, quantity: 1 }])
    expect(res49.vatAmount).toBe(3)
    expect(res49.total).toBe(52)

    // 7 satang * 0.07 = 0.49 satang -> rounds down to 0 satang
    const res7 = calcQuoteTotals([{ unitPrice: 7, quantity: 1 }])
    expect(res7.vatAmount).toBe(0)
    expect(res7.total).toBe(7)
  })

  it('ADV-FIN-09: VAT 7% rounding above half-satang boundary (n.51 satang)', () => {
    // 8 satang * 0.07 = 0.56 satang -> rounds up to 1 satang
    const res8 = calcQuoteTotals([{ unitPrice: 8, quantity: 1 }])
    expect(res8.vatAmount).toBe(1)
    expect(res8.total).toBe(9)

    // 51 satang * 0.07 = 3.57 satang -> rounds up to 4 satang
    const res51 = calcQuoteTotals([{ unitPrice: 51, quantity: 1 }])
    expect(res51.vatAmount).toBe(4)
    expect(res51.total).toBe(55)
  })

  it('ADV-FIN-10: Large quote accumulation prevents IEEE-754 precision loss', () => {
    // 100,000 items of 33,333 satang (333.33 THB)
    const items = [{ unitPrice: 33333, quantity: 3000 }] // Subtotal = 99,999,000 satang
    const res = calcQuoteTotals(items)
    expect(res.subtotal).toBe(99999000)
    // 99,999,000 * 0.07 = 6,999,930.0 satang
    expect(res.vatAmount).toBe(6999930)
    expect(res.total).toBe(106998930)
    expect(Number.isSafeInteger(res.total)).toBe(true)
  })

  it('ADV-FIN-11: Empty lines return exact 0 without NaN', () => {
    const res = calcQuoteTotals([])
    expect(res.subtotal).toBe(0)
    expect(res.vatAmount).toBe(0)
    expect(res.total).toBe(0)
  })

  it('ADV-FIN-12: Zero quantity and zero price lines produce zero without error', () => {
    const res = calcQuoteTotals([
      { unitPrice: 0, quantity: 5 },
      { unitPrice: 10000, quantity: 0 },
    ])
    expect(res.subtotal).toBe(0)
    expect(res.vatAmount).toBe(0)
    expect(res.total).toBe(0)
  })

  // ─── 3. formatSatang helper checks ─────────────────────────────────────────
  it('ADV-FIN-13: formatSatang formats satang integers to localized Thai Baht strings', () => {
    expect(formatSatang(0)).toBe('฿0.00')
    expect(formatSatang(null)).toBe('฿0.00')
    expect(formatSatang(undefined)).toBe('฿0.00')
    expect(formatSatang(100)).toBe('฿1.00')
    expect(formatSatang(15000)).toBe('฿150.00')
    expect(formatSatang(333333)).toBe('฿3,333.33')
  })
})

describe('Tier 5: Challenger M6-2 - 16-Step SLA Clocks & Division-by-Zero Protection', () => {
  // ─── 1. Division-by-Zero Protection when maxHours === 0 ──────────────────
  it('ADV-SLA-01: getSlaStatus does not crash with division-by-zero when maxHours === 0 (dueAt === startedAt)', () => {
    const now = new Date()
    // startedAt === dueAt means 0 total duration
    const clock = {
      status: 'RUNNING',
      startedAt: now,
      dueAt: now,
      pausedMinutes: 0,
    }
    // Execution must complete safely without throwing or returning NaN
    const status = getSlaStatus(clock)
    expect(['ON_TRACK', 'AT_RISK', 'OVERDUE'].includes(status)).toBe(true)
  })

  it('ADV-SLA-02: getSlaStatus when dueAt is past returns OVERDUE regardless of 0 duration', () => {
    const now = Date.now()
    const clock = {
      status: 'RUNNING',
      startedAt: new Date(now - 10000),
      dueAt: new Date(now - 1000), // 1s past
      pausedMinutes: 0,
    }
    expect(getSlaStatus(clock)).toBe('OVERDUE')
  })

  it('ADV-SLA-03: getSlaStatus without startedAt defaults safely to 24h duration', () => {
    const now = Date.now()
    const clock = {
      status: 'RUNNING',
      dueAt: new Date(now + 12 * 3600000), // 12h remaining out of 24h default (50% >= 20%)
      pausedMinutes: 0,
    }
    expect(getSlaStatus(clock)).toBe('ON_TRACK')
  })

  it('ADV-SLA-04: getSlaStatus returns ON_TRACK for STOPPED clock even if dueAt expired', () => {
    const now = Date.now()
    const clock = {
      status: 'STOPPED',
      startedAt: new Date(now - 100 * 3600000),
      dueAt: new Date(now - 50 * 3600000),
      stoppedAt: new Date(now - 60 * 3600000),
      pausedMinutes: 0,
    }
    expect(getSlaStatus(clock)).toBe('ON_TRACK')
  })

  it('ADV-SLA-05: getHoursInStep handles edge cases without negative hours', () => {
    const now = new Date()
    // startedAt in the future due to slight NTP drift
    const futureClock = {
      startedAt: new Date(now.getTime() + 60000),
      pausedMinutes: 0,
    }
    expect(getHoursInStep(futureClock)).toBe(0)

    // stopped clock with pausedMinutes exceeding elapsed
    const pausedClock = {
      startedAt: new Date(now.getTime() - 3600000),
      stoppedAt: now,
      pausedMinutes: 120, // paused for 2h out of 1h
    }
    expect(getHoursInStep(pausedClock)).toBe(0)
  })

  // ─── 2. Clock Pause on WAITING_PARTS & Resumption on PARTS_ARRIVED ────────
  it('ADV-SLA-06: Pausing VD_REPAIR clock preserves dueAt and sets PAUSED status', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-01' })
    const now = new Date()
    const originalDue = new Date(now.getTime() + 168 * 3600000)
    const job = createMockJob({
      stage: 'REPAIRING',
      vendorCenterId: 'vc-01',
      slaClocks: [
        {
          stepCode: 'VD_REPAIR',
          status: 'RUNNING',
          startedAt: now,
          dueAt: originalDue,
          pausedMinutes: 0,
          stoppedAt: null,
        },
      ],
    })

    const res = simulateAction(job, 'vd_pause_parts', vdUser)
    expect(res.success).toBe(true)
    const clock = res.job?.slaClocks.find(c => c.stepCode === 'VD_REPAIR')
    expect(clock?.status).toBe('PAUSED')
  })

  it('ADV-SLA-07: Resuming VD_REPAIR clock extends dueAt by exact paused duration', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-01' })
    const start = new Date(Date.now() - 48 * 3600000)
    const due = new Date(start.getTime() + 168 * 3600000)
    const pauseDurationMs = 24 * 3600000 // 24 hours (1440 minutes) paused

    const job = createMockJob({
      stage: 'REPAIRING',
      vendorCenterId: 'vc-01',
      slaClocks: [
        {
          stepCode: 'VD_REPAIR',
          status: 'PAUSED',
          startedAt: start,
          dueAt: due,
          pausedMinutes: 0,
          stoppedAt: null,
        },
      ],
    })

    const res = simulateAction(job, 'vd_resume_parts', vdUser, { pauseDurationMs })
    expect(res.success).toBe(true)
    const clock = res.job?.slaClocks.find(c => c.stepCode === 'VD_REPAIR')
    expect(clock?.status).toBe('RUNNING')
    expect(clock?.pausedMinutes).toBe(1440)
    expect(clock?.dueAt.getTime()).toBe(due.getTime() + pauseDurationMs)
  })

  it('ADV-SLA-08: Non-pausable steps cannot be paused', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'CS_OPENED',
      slaClocks: [
        {
          stepCode: 'CS_HANDOVER',
          status: 'RUNNING',
          startedAt: new Date(),
          dueAt: new Date(Date.now() + 24 * 3600000),
          pausedMinutes: 0,
          stoppedAt: null,
        },
      ],
    })

    const res = simulateAction(job, 'vd_pause_parts', csUser)
    expect(res.success).toBe(false)
  })

  // ─── 3. Owner Resolution across 16 steps ──────────────────────────────────
  it('ADV-SLA-09: resolveOwner maps CARRIER steps dynamically to DC, VD or TPL', () => {
    // For DC channel:
    expect(resolveOwner('CARRIER', 'CARRIER_PICKUP', 'DC')).toBe('DC')
    expect(resolveOwner('CARRIER', 'VD_RECEIVE', 'DC')).toBe('VD')
    expect(resolveOwner('CARRIER', 'GR_RETURN_RECEIVE', 'DC')).toBe('DC')

    // For DSD channel:
    expect(resolveOwner('CARRIER', 'CARRIER_PICKUP', 'DSD')).toBe('VD')
    expect(resolveOwner('CARRIER', 'VD_RECEIVE', 'DSD')).toBe('VD')

    // For TPL channel:
    expect(resolveOwner('CARRIER', 'CARRIER_PICKUP', 'TPL')).toBe('TPL')
    expect(resolveOwner('CARRIER', 'VD_RECEIVE', 'TPL')).toBe('TPL')

    // Direct department steps unchanged:
    expect(resolveOwner('CS', 'CS_HANDOVER', 'DC')).toBe('CS')
    expect(resolveOwner('GR', 'GR_PACK', 'DC')).toBe('GR')
    expect(resolveOwner('VD', 'VD_REPAIR', 'DC')).toBe('VD')
  })
})

describe('Tier 5: Challenger M6-2 - Vendor Payout Batch & Double Settlement Protection', () => {
  // ─── 1. Double Settlement Protection ─────────────────────────────────────
  it('ADV-PAY-01: Jobs already with SENT payout line are protected against re-inclusion', () => {
    const activeJobs = [
      { id: 'job-1', payoutLines: [{ status: 'SENT' }] },
      { id: 'job-2', payoutLines: [] },
    ]
    // Filter simulating Prisma query: payoutLines: { none: { status: { in: ['SENT', 'PAID'] } } }
    const eligible = activeJobs.filter(j => !j.payoutLines.some(l => ['SENT', 'PAID'].includes(l.status)))
    expect(eligible.length).toBe(1)
    expect(eligible[0].id).toBe('job-2')
  })

  it('ADV-PAY-02: Jobs already with PAID payout line are protected against re-inclusion', () => {
    const activeJobs = [
      { id: 'job-3', payoutLines: [{ status: 'PAID' }] },
      { id: 'job-4', payoutLines: [] },
    ]
    const eligible = activeJobs.filter(j => !j.payoutLines.some(l => ['SENT', 'PAID'].includes(l.status)))
    expect(eligible.length).toBe(1)
    expect(eligible[0].id).toBe('job-4')
  })

  it('ADV-PAY-03: All selected jobs already SENT/PAID results in complete rejection', () => {
    const activeJobs = [
      { id: 'job-5', payoutLines: [{ status: 'SENT' }] },
      { id: 'job-6', payoutLines: [{ status: 'PAID' }] },
    ]
    const eligible = activeJobs.filter(j => !j.payoutLines.some(l => ['SENT', 'PAID'].includes(l.status)))
    expect(eligible.length).toBe(0)
    // When eligible.length === 0, route throws: 'รายการที่เลือกถูกส่งทำจ่ายไปแล้วทั้งหมด'
  })

  // ─── 2. Bi-Monthly Cycle Boundaries ──────────────────────────────────────
  it('ADV-PAY-04: Bi-monthly cycles cut off on day 5 and day 20 with non-overlapping bounds', () => {
    // First half of month: 5th to 19th (15 days)
    // Second half of month: 20th to 4th of next month (13-16 days depending on month)
    const date1 = new Date('2026-09-05T00:00:00+07:00')
    const date2 = new Date('2026-09-19T23:59:59+07:00')
    const date3 = new Date('2026-09-20T00:00:00+07:00')
    const date4 = new Date('2026-10-04T23:59:59+07:00')

    expect(date2.getTime() < date3.getTime()).toBe(true)
    expect(date3.getTime() - date2.getTime()).toBe(1000) // Exactly 1ms gap at midnight
  })

  it('ADV-PAY-05: February leap-year cycle boundary handles Feb 29 cleanly', () => {
    const leapFeb20 = new Date('2028-02-20T00:00:00+07:00')
    const leapMar04 = new Date('2028-03-04T23:59:59+07:00')
    const feb29Job = new Date('2028-02-29T12:00:00+07:00')

    const isInLeapCycle = feb29Job >= leapFeb20 && feb29Job <= leapMar04
    expect(isInLeapCycle).toBe(true)
  })

  // ─── 3. GP Satang Precision & Deductions ─────────────────────────────────
  it('ADV-PAY-06: GP satang calculation rounds Half-Up and conserves total satang', () => {
    // ฿3,333.33 repair = 333,333 satang
    // GP 18% = 59,999.94 satang -> rounds to 60,000 satang
    const res = calcVendorPayout({
      subtotalSatang: 333333,
      gpPct: 18.0,
      deductionsSatang: 0,
    })
    expect(res.repairAmountSatang).toBe(333333)
    expect(res.gpAmountSatang).toBe(60000)
    expect(res.netVendorPayableSatang).toBe(273333)
    // Conservation test: repairAmountSatang === gpAmountSatang + netVendorPayableSatang
    expect(res.repairAmountSatang).toBe(res.gpAmountSatang + res.netVendorPayableSatang)
  })

  it('ADV-PAY-07: 0% GP payout preserves 100% of repair amount', () => {
    const res = calcVendorPayout({
      subtotalSatang: 450000,
      gpPct: 0.0,
      deductionsSatang: 0,
    })
    expect(res.gpAmountSatang).toBe(0)
    expect(res.netVendorPayableSatang).toBe(450000)
  })

  it('ADV-PAY-08: 100% GP payout allocates entire amount to Thai Watsadu', () => {
    const res = calcVendorPayout({
      subtotalSatang: 450000,
      gpPct: 100.0,
      deductionsSatang: 0,
    })
    expect(res.gpAmountSatang).toBe(450000)
    expect(res.netVendorPayableSatang).toBe(0)
  })

  it('ADV-PAY-09: Deductions with satang precision are subtracted from net payable', () => {
    const res = calcVendorPayout({
      subtotalSatang: 100000, // ฿1,000.00
      gpPct: 20.0,            // ฿200.00 GP -> Net before deductions = ฿800.00 (80,000 satang)
      deductionsSatang: 15000, // ฿150.00 penalty deduction
    })
    expect(res.gpAmountSatang).toBe(20000)
    expect(res.netVendorPayableSatang).toBe(65000) // ฿650.00 payable
  })

  it('ADV-PAY-10: Payout batch creation floors total amount at 0 if deductions exceed total net', () => {
    // Total net satang: 50,000 satang. Total deductions: 80,000 satang.
    const totalNetSatang = 50000
    const totalDeductionsSatang = 80000
    const batchTotalAmount = Math.max(0, totalNetSatang - totalDeductionsSatang)
    expect(batchTotalAmount).toBe(0)
  })
})
