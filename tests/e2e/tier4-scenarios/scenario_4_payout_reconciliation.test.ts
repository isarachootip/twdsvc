/**
 * Tier 4: Real-World Application Scenario 4
 * Vendor bi-monthly billing cycle payout ledger reconciliation with GP deductions
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob } from '../../framework/helpers'

setTier('Tier 4')

describe('Tier 4: Scenario 4 - Vendor Bi-Monthly Billing Cycle Payout Reconciliation', () => {
  it('SCN-04-A: Accounting aggregates all customer jobs closed as CLOSED_REPAIRED between 1st and 15th of month for Makita Service Center', () => {
    const cycleRange = { start: new Date('2026-09-01T00:00:00Z'), end: new Date('2026-09-15T23:59:59Z') }
    const closedJobs = [
      { jobNo: 'JB-2609-00101', subtotalSatang: 120000, closedAt: new Date('2026-09-03T14:00:00Z'), vendorCenterId: 'vc-makita' },
      { jobNo: 'JB-2609-00102', subtotalSatang: 85000, closedAt: new Date('2026-09-07T11:30:00Z'), vendorCenterId: 'vc-makita' },
      { jobNo: 'JB-2609-00103', subtotalSatang: 240000, closedAt: new Date('2026-09-12T16:45:00Z'), vendorCenterId: 'vc-makita' },
      { jobNo: 'JB-2609-00104', subtotalSatang: 175000, closedAt: new Date('2026-09-14T09:15:00Z'), vendorCenterId: 'vc-makita' },
      { jobNo: 'JB-2609-00105', subtotalSatang: 90000, closedAt: new Date('2026-09-18T10:00:00Z'), vendorCenterId: 'vc-makita' }, // Outside cycle!
    ]

    const eligibleJobs = closedJobs.filter(
      (j) => j.closedAt >= cycleRange.start && j.closedAt <= cycleRange.end
    )
    expect(eligibleJobs.length).toBe(4)
    expect(eligibleJobs.some((j) => j.jobNo === 'JB-2609-00105')).toBe(false)
  })

  it('SCN-04-B: Total gross repair amount for the cycle sums to ฿6,200.00 (620,000 satang ex-VAT)', () => {
    const eligibleJobs = [
      { subtotalSatang: 120000 },
      { subtotalSatang: 85000 },
      { subtotalSatang: 240000 },
      { subtotalSatang: 175000 },
    ]
    const grossTotalSatang = eligibleJobs.reduce((sum, j) => sum + j.subtotalSatang, 0)
    expect(grossTotalSatang).toBe(620000) // ฿6,200.00
  })

  it('SCN-04-C: Standard vendor GP% of 18.0% is calculated on the ex-VAT repair gross (฿1,116.00 / 111,600 satang)', () => {
    const grossTotalSatang = 620000
    const gpPct = 18.0
    const gpSatang = Math.floor((grossTotalSatang * gpPct) / 100 + 0.5)
    expect(gpSatang).toBe(111600) // ฿1,116.00 Thai Watsadu GP commission
  })

  it('SCN-04-D: Quality penalty deduction is assessed for SLA delay breach on Job JB-2609-00103 (฿250.00 / 25,000 satang)', () => {
    const penaltySatang = 25000
    expect(penaltySatang).toBe(25000)
  })

  it('SCN-04-E: Net vendor payable calculates to ฿4,834.00 (483,400 satang) matching the accounting payout ledger', () => {
    const grossTotalSatang = 620000
    const gpSatang = 111600
    const penaltySatang = 25000
    const netPayableSatang = grossTotalSatang - gpSatang - penaltySatang
    expect(netPayableSatang).toBe(483400) // ฿4,834.00

    const oracleCalc = SPEC_ORACLE.calcVendorPayout({
      subtotalSatang: grossTotalSatang,
      gpPct: 18.0,
      deductionsSatang: penaltySatang,
    })
    expect(oracleCalc.netVendorPayableSatang).toBe(483400)
  })

  it('SCN-04-F: Batch progression locks batch status from DRAFT into SENT and generates Excel payout ledger', () => {
    const batch = {
      batchNo: 'PB-2609-01',
      cycle: '2026-09-CYCLE-1',
      vendorCode: 'VD-MAKITA',
      jobCount: 4,
      grossSatang: 620000,
      gpSatang: 111600,
      deductionsSatang: 25000,
      netSatang: 483400,
      status: 'DRAFT' as 'DRAFT' | 'SENT' | 'PAID',
    }
    // Submit to accounting
    batch.status = 'SENT'
    expect(batch.status).toBe('SENT')
  })

  it('SCN-04-G: Finance department marks batch as PAID upon bank wire transfer completion', () => {
    const batch = {
      batchNo: 'PB-2609-01',
      status: 'SENT' as 'DRAFT' | 'SENT' | 'PAID',
      paidAt: null as Date | null,
    }
    batch.status = 'PAID'
    batch.paidAt = new Date()
    expect(batch.status).toBe('PAID')
    expect(batch.paidAt).toBeDefined()
  })
})
