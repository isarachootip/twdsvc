/**
 * Tier 2: Boundary & Empirical Verification - Executive & Operations Reports
 * Tests:
 * 1. Period filters & date range bucketing (executiveRange, overviewRange)
 * 2. Integer Satang calculations, VAT derivation, and GP margin
 * 3. Backlog aging bucket partitions (exact boundary checks)
 * 4. SLA breach rate & compliance metrics
 * 5. 5-Stage Operational pipeline breakdown
 * 6. Vendor concentration risk & attention rules
 * 7. Waiting parts and vendor performance rankings
 */

import { describe, it, expect, setTier } from '../../framework/core'
import {
  bkk,
  bkkDate,
  executiveRange,
  overviewRange,
  jobFinance,
  jobBreached,
  summarize,
  backlogAging,
  pipelineCounts,
  waitingParts,
  vdPerformance,
  inRange,
  type ClosedJob,
} from '../../../src/lib/reports'
import { STAGE_ORDER, type Stage } from '../../../src/lib/constants'

setTier('Tier 2')

describe('Tier 2: Boundary - Reports Period Filters & Date Bucketing', () => {
  const fixedDate = new Date('2026-09-20T10:30:00.000Z') // 17:30 Bangkok time, Sept 20, 2026

  it('BND-REP-01: Bangkok calendar parts correctly extract Y, M, D with +7h offset', () => {
    const parts = bkk(fixedDate)
    expect(parts.y).toBe(2026)
    expect(parts.m).toBe(8) // September (0-indexed)
    expect(parts.d).toBe(20)

    // Midnight check
    const midnight = bkkDate(2026, 8, 20)
    expect(midnight.toISOString()).toBe('2026-09-19T17:00:00.000Z') // Midnight BKK = 17:00 UTC previous day
  })

  it('BND-REP-02: executiveRange supports daily/7d, month/30d, quarter/90d, and year/1y', () => {
    // Daily
    const daily = executiveRange('daily', fixedDate)
    expect(daily.cur.label).toContain('วันนี้')
    expect(daily.cur.label).toContain('2569')
    expect(daily.prior.label).toBe('เมื่อวาน')
    expect(daily.buckets.length).toBe(7)

    // Month
    const month = executiveRange('month', fixedDate)
    expect(month.cur.label).toContain('เดือนนี้')
    expect(month.cur.label).toContain('ก.ย. 2569')
    expect(month.prior.label).toBe('เดือนก่อน')
    expect(month.buckets.length).toBe(5)

    // Quarter
    const quarter = executiveRange('quarter', fixedDate)
    expect(quarter.cur.label).toContain('ไตรมาส 3/2569')
    expect(quarter.prior.label).toBe('ไตรมาสก่อน')
    expect(quarter.buckets.length).toBe(4)

    // Year
    const year = executiveRange('year', fixedDate)
    expect(year.cur.label).toContain('ปี 2569 (YTD)')
    expect(year.prior.label).toContain('ปีก่อน')
    expect(year.buckets.length).toBe(5)

    // Fallback on empty or unknown string defaults to month
    const fallback = executiveRange('', fixedDate)
    expect(fallback.cur.label).toContain('เดือนนี้')
  })

  it('BND-REP-03: overviewRange partitions weekly into 7 days, monthly into months, yearly into 3 years', () => {
    const weekly = overviewRange('weekly', fixedDate)
    expect(weekly.cur.label).toBe('7 วันล่าสุด')
    expect(weekly.buckets.length).toBe(7)

    const monthly = overviewRange('monthly', fixedDate)
    expect(monthly.cur.label).toContain('2569')
    expect(monthly.buckets.length).toBe(9) // Jan to Sep = 9 months

    const yearly = overviewRange('yearly', fixedDate)
    expect(yearly.cur.label).toBe('3 ปีล่าสุด')
    expect(yearly.buckets.length).toBe(3)
  })

  it('BND-REP-04: inRange correctly tests half-open interval [from, to)', () => {
    const bucket = { from: new Date('2026-09-01T00:00:00Z'), to: new Date('2026-09-10T00:00:00Z') }
    expect(inRange(new Date('2026-09-01T00:00:00Z'), bucket)).toBe(true)
    expect(inRange(new Date('2026-09-05T12:00:00Z'), bucket)).toBe(true)
    expect(inRange(new Date('2026-09-10T00:00:00Z'), bucket)).toBe(false) // Strict boundary
    expect(inRange(new Date('2026-08-31T23:59:59Z'), bucket)).toBe(false)
    expect(inRange(null, bucket)).toBe(false)
  })
})

describe('Tier 2: Boundary - Satang Financial Math & Margin Invariants', () => {
  const mockClosedJob: ClosedJob = {
    id: 'job-01',
    jobNo: 'JB-2609-00001',
    type: 'CUSTOMER',
    stage: 'CLOSED_REPAIRED',
    channel: 'DC',
    openedAt: new Date('2026-09-01T08:00:00Z'),
    closedAt: new Date('2026-09-05T12:00:00Z'),
    branchId: 'br-01',
    vendorCenterId: 'vc-01',
    customerName: 'สมชาย ชัยชนะ',
    productName: 'สว่านโรตารี่ 26 มม.',
    branch: { id: 'br-01', name: 'สาขาบางนา', nickname: 'บางนา' },
    charges: [
      { type: 'OPERATION_FEE', amount: 30000 },
      { type: 'SHIPPING_FEE', amount: 25000 },
      { type: 'OPERATION_FEE_CREDIT', amount: -30000 },
    ],
    quotes: [
      {
        status: 'APPROVED',
        subtotal: 120000, // 1,200.00 THB ex-vat
        total: 128400,    // 1,284.00 THB inc-vat
        lines: [
          { type: 'LABOR', unitPrice: 50000, quantity: 1, partWaitDays: 0 },
          { type: 'PART', unitPrice: 70000, quantity: 1, partWaitDays: 3 },
        ],
      },
    ],
    vendorCenter: {
      id: 'vc-01',
      code: 'VC-BKK-01',
      gpPctOverride: 20.0,
      vendorParent: { id: 'vp-01', code: 'VD-01', name: 'บ.ช่างเจริญการช่าง', defaultGpPct: 18.0 },
    },
    shipments: [{ cost: 15000 }],
    slaClocks: [
      {
        status: 'STOPPED',
        breached: false,
        startedAt: new Date('2026-09-01T08:00:00Z'),
        dueAt: new Date('2026-09-03T08:00:00Z'),
        stoppedAt: new Date('2026-09-02T16:00:00Z'),
        slaStep: { code: 'VD_REPAIR', ownerDept: 'VD' },
      },
    ],
  } as unknown as ClosedJob

  it('BND-REP-05: jobFinance computes exact Satang revenue, cost, GP, and labor/parts shares', () => {
    const vat = 0.07
    const f = jobFinance(mockClosedJob, vat)

    // Intake net = 30000 + 25000 - 30000 = 25000
    // Intake ex-vat = round(25000 / 1.07) = 23364
    // Revenue = 23364 + 120000 = 143364
    expect(f.revenue).toBe(143364)

    // GP% = 20% override
    // gpAmount = floor(120000 * 20 / 100 + 0.5) = 24000
    // vdNet = 120000 - 24000 = 96000
    // Cost = 96000 + 15000 (shipment) = 111000
    expect(f.gpAmount).toBe(24000)
    expect(f.vdNet).toBe(96000)
    expect(f.cost).toBe(111000)

    // Gross profit = 143364 - 111000 = 32364
    expect(f.gp).toBe(32364)

    // Line shares: labor = 50000, parts = 70000, total = 120000
    // Labor share = 50000 / 120000 = 0.416666...
    // gpLabor = round(32364 * 50 / 120) = 13485
    // gpParts = round(32364 * 70 / 120) = 18879
    expect(f.gpLabor).toBe(13485)
    expect(f.gpParts).toBe(18879)

    // Invariant: gpLabor + gpParts === gp
    expect(f.gpLabor + f.gpParts).toBe(f.gp)

    // Invariant: all values are integers
    expect(Number.isInteger(f.revenue)).toBe(true)
    expect(Number.isInteger(f.cost)).toBe(true)
    expect(Number.isInteger(f.gp)).toBe(true)
  })

  it('BND-REP-06: summarize aggregates financial and SLA metrics across closed jobs list', () => {
    const vat = 0.07
    const summary = summarize([mockClosedJob, mockClosedJob], vat)
    expect(summary.closed).toBe(2)
    expect(summary.revenue).toBe(143364 * 2)
    expect(summary.cost).toBe(111000 * 2)
    expect(summary.gp).toBe(32364 * 2)
    expect(summary.slaCompliance).toBe(100) // Both on-time

    // TAT = (Sep 5 12:00 - Sep 1 08:00) = 4.1666 days
    expect(summary.tat).toBe(4.2)
  })

  it('BND-REP-07: summarize handles empty jobs list safely without NaN or division by zero', () => {
    const summary = summarize([], 0.07)
    expect(summary.closed).toBe(0)
    expect(summary.revenue).toBe(0)
    expect(summary.cost).toBe(0)
    expect(summary.gp).toBe(0)
    expect(summary.slaCompliance).toBe(0)
    expect(summary.tat).toBe(0)
  })
})

describe('Tier 2: Boundary - Backlog Aging & Exact Partition Invariants', () => {
  it('BND-REP-08: backlogAging partitions jobs into 4 age buckets with 100% conservation', () => {
    const now = new Date('2026-09-20T12:00:00Z')
    const jobs = [
      { openedAt: new Date('2026-09-20T06:00:00Z') }, // 0.25d -> d3, under7
      { openedAt: new Date('2026-09-17T12:00:00Z') }, // exactly 3.0d -> d3, under7
      { openedAt: new Date('2026-09-16T12:00:00Z') }, // 4.0d -> d7, under7
      { openedAt: new Date('2026-09-13T12:00:00Z') }, // exactly 7.0d -> d7, under7
      { openedAt: new Date('2026-09-10T12:00:00Z') }, // 10.0d -> d14
      { openedAt: new Date('2026-09-06T12:00:00Z') }, // exactly 14.0d -> d14
      { openedAt: new Date('2026-09-01T12:00:00Z') }, // 19.0d -> over14, d30
      { openedAt: new Date('2026-08-21T12:00:00Z') }, // exactly 30.0d -> over14, d30
      { openedAt: new Date('2026-08-10T12:00:00Z') }, // 41.0d -> over14, over30
    ]

    const aging = backlogAging(jobs, now)

    // 4 buckets (executive dashboard view)
    expect(aging.d3).toBe(2)
    expect(aging.d7).toBe(2)
    expect(aging.d14).toBe(2)
    expect(aging.over14).toBe(3)
    expect(aging.d3 + aging.d7 + aging.d14 + aging.over14).toBe(jobs.length)

    // 4 standard buckets (0-7, 8-14, 15-30, >30)
    expect(aging.under7).toBe(4) // d3 + d7
    expect(aging.under7).toBe(aging.d3 + aging.d7)
    expect(aging.d30).toBe(2)
    expect(aging.over30).toBe(1)
    expect(aging.under7 + aging.d14 + aging.d30 + aging.over30).toBe(jobs.length)
    expect(aging.d30 + aging.over30).toBe(aging.over14)

    // List representation contains 4 colored buckets
    expect(aging.list.length).toBe(4)
    expect(aging.list[0].name).toContain('0–3 วัน')
    expect(aging.list[3].name).toContain('15+ วัน')
  })
})

describe('Tier 2: Boundary - SLA Breaches & Clock Evaluation', () => {
  it('BND-REP-09: jobBreached returns true if any clock is breached or running overdue', () => {
    const now = new Date('2026-09-20T12:00:00Z')

    // Case 1: Stopped without breach -> false
    const jobOk = {
      slaClocks: [
        { breached: false, status: 'STOPPED', dueAt: new Date('2026-09-19T00:00:00Z') },
      ],
    } as unknown as ClosedJob
    expect(jobBreached(jobOk, now)).toBe(false)

    // Case 2: Flagged breached -> true
    const jobBreachedFlag = {
      slaClocks: [
        { breached: true, status: 'STOPPED', dueAt: new Date('2026-09-19T00:00:00Z') },
      ],
    } as unknown as ClosedJob
    expect(jobBreached(jobBreachedFlag, now)).toBe(true)

    // Case 3: Running past due date -> true
    const jobRunningOverdue = {
      slaClocks: [
        { breached: false, status: 'RUNNING', dueAt: new Date('2026-09-20T11:00:00Z') },
      ],
    } as unknown as ClosedJob
    expect(jobBreached(jobRunningOverdue, now)).toBe(true)

    // Case 4: Running before due date -> false
    const jobRunningOnTrack = {
      slaClocks: [
        { breached: false, status: 'RUNNING', dueAt: new Date('2026-09-20T15:00:00Z') },
      ],
    } as unknown as ClosedJob
    expect(jobBreached(jobRunningOnTrack, now)).toBe(false)
  })

  it('BND-REP-10: SLA compliance rate accurately scales from 0% to 100%', () => {
    const jobPass = {
      openedAt: new Date(),
      closedAt: new Date(),
      charges: [],
      shipments: [],
      quotes: [],
      vendorCenter: null,
      slaClocks: [{ breached: false, status: 'STOPPED', dueAt: new Date() }],
    } as unknown as ClosedJob

    const jobFail = {
      openedAt: new Date(),
      closedAt: new Date(),
      charges: [],
      shipments: [],
      quotes: [],
      vendorCenter: null,
      slaClocks: [{ breached: true, status: 'STOPPED', dueAt: new Date() }],
    } as unknown as ClosedJob

    expect(summarize([jobPass, jobPass], 0.07).slaCompliance).toBe(100)
    expect(summarize([jobPass, jobFail], 0.07).slaCompliance).toBe(50)
    expect(summarize([jobFail, jobFail], 0.07).slaCompliance).toBe(0)
    expect(summarize([jobPass, jobPass, jobFail], 0.07).slaCompliance).toBe(66.7)
  })
})

describe('Tier 2: Boundary - Operational Pipeline & Vendor Rankings', () => {
  it('BND-REP-11: pipelineCounts categorizes all 19 stages into 5 operational groups excluding CLOSED', () => {
    const allStages = [...STAGE_ORDER]
    const counts = pipelineCounts(allStages)

    expect(counts.INTAKE).toBe(8)             // PENDING_VENDOR_ASSIGNMENT to VD_INSPECTING (8 stages)
    expect(counts.WAITING_APPROVAL).toBe(1)   // WAITING_APPROVAL (1 stage)
    expect(counts.REPAIR_IN_PROGRESS).toBe(1) // REPAIRING (1 stage)
    expect(counts.QA_LOGISTICS).toBe(5)       // RETURN_PACKING to GR_RETURN_RECEIVED (5 stages)
    expect(counts.READY_FOR_PICKUP).toBe(1)   // READY_FOR_PICKUP (1 stage)

    // Sum of open pipeline stages = 8 + 1 + 1 + 5 + 1 = 16 (out of 19, 3 are CLOSED)
    const openTotal = counts.INTAKE + counts.WAITING_APPROVAL + counts.REPAIR_IN_PROGRESS + counts.QA_LOGISTICS + counts.READY_FOR_PICKUP
    expect(openTotal).toBe(16)
  })

  it('BND-REP-12: vdPerformance computes on-time %, SLA %, and revenue per vendor parent', () => {
    const closedJobWithVD = {
      quotes: [{ subtotal: 80000 }],
      vendorCenter: {
        vendorParent: { id: 'vp-01', code: 'VD-01', name: 'ช่างโปร' },
      },
      channel: 'DC',
      slaClocks: [
        {
          breached: false,
          status: 'STOPPED',
          slaStep: { code: 'VD_REPAIR', ownerDept: 'VD' },
          dueAt: new Date(),
          stoppedAt: new Date(),
        },
        {
          breached: false,
          status: 'STOPPED',
          slaStep: { code: 'VD_QUOTE', ownerDept: 'VD' },
          dueAt: new Date(),
          stoppedAt: new Date(),
        },
      ],
    } as unknown as ClosedJob

    const vdList = vdPerformance([closedJobWithVD])
    expect(vdList.length).toBe(1)
    expect(vdList[0].vdCode).toBe('VD-01')
    expect(vdList[0].jobs).toBe(1)
    expect(vdList[0].revenue).toBe(80000)
    expect(vdList[0].onTime).toBe(100)
    expect(vdList[0].sla).toBe(100)
  })
})
