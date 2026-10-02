/**
 * Customer 360 Service View Test Suite
 * Tests customer aggregation, search, device grouping by serialNo, and repair history.
 */

import { describe, it, expect } from '../../framework/core'
import {
  groupJobsByDevice,
  aggregateCustomerStats,
  normalizePhoneNumber,
} from '../../../src/lib/services/customer-service'

describe('Customer Service Aggregation & Logic', () => {
  it('CUST-01: normalizes phone numbers by removing non-digits', () => {
    expect(normalizePhoneNumber('081-234-5678')).toBe('0812345678')
    expect(normalizePhoneNumber('  081 234 5678  ')).toBe('0812345678')
    expect(normalizePhoneNumber('+66812345678')).toBe('0812345678')
    expect(normalizePhoneNumber('')).toBe('')
  })

  it('CUST-02: groups jobs with the same serialNo into a single device with repeated repair history', () => {
    const mockJobs: any[] = [
      {
        id: 'job-1',
        jobNo: 'SV-202610-0001',
        stage: 'CLOSED_REPAIRED',
        brandName: 'Makita',
        productName: 'สว่านโรตารี่ HR2470',
        serialNo: 'SN-MAK-999',
        sku: '10001',
        openedAt: new Date('2026-10-01T10:00:00Z'),
        closedAt: new Date('2026-10-03T15:00:00Z'),
        branch: { name: 'สาขาบางนา' },
        symptom: 'มอเตอร์มีควัน',
        hasWarranty: true,
        charges: [{ amount: 500 }],
      },
      {
        id: 'job-2',
        jobNo: 'SV-202610-0002',
        stage: 'REPAIRING',
        brandName: 'Makita',
        productName: 'สว่านโรตารี่ HR2470',
        serialNo: 'SN-MAK-999',
        sku: '10001',
        openedAt: new Date('2026-10-05T09:00:00Z'),
        closedAt: null,
        branch: { name: 'สาขาบางนา' },
        symptom: 'หัวจับดอกหลวม',
        hasWarranty: false,
        charges: [{ amount: 800 }],
      },
    ]

    const devices = groupJobsByDevice(mockJobs)
    expect(devices.length).toBe(1)
    expect(devices[0].serialNo).toBe('SN-MAK-999')
    expect(devices[0].repairCount).toBe(2)
    expect(devices[0].jobs.length).toBe(2)
    expect(devices[0].jobs[0].jobNo).toBe('SV-202610-0002') // Latest first
    expect(devices[0].jobs[1].jobNo).toBe('SV-202610-0001')
  })

  it('CUST-03: groups items without serialNo by brand and product name separately', () => {
    const mockJobs: any[] = [
      {
        id: 'job-3',
        jobNo: 'SV-202610-0003',
        stage: 'CS_OPENED',
        brandName: 'Bosch',
        productName: 'เครื่องเจียร GWS 060',
        serialNo: null,
        sku: '10002',
        openedAt: new Date('2026-10-01T10:00:00Z'),
        closedAt: null,
        branch: { name: 'สาขารังสิต' },
        symptom: 'สวิตช์เปิดไม่ติด',
        hasWarranty: true,
        charges: [],
      },
      {
        id: 'job-4',
        jobNo: 'SV-202610-0004',
        stage: 'CLOSED_REPAIRED',
        brandName: 'Dewalt',
        productName: 'เลื่อยวงเดือน DWE560',
        serialNo: '',
        sku: '10003',
        openedAt: new Date('2026-10-02T10:00:00Z'),
        closedAt: new Date('2026-10-04T12:00:00Z'),
        branch: { name: 'สาขาบางนา' },
        symptom: 'ใบเลื่อยแกว่ง',
        hasWarranty: false,
        charges: [{ amount: 1200 }],
      },
    ]

    const devices = groupJobsByDevice(mockJobs)
    expect(devices.length).toBe(2)
  })

  it('CUST-04: aggregates customer stats correctly', () => {
    const mockJobs: any[] = [
      {
        id: 'job-1',
        stage: 'CLOSED_REPAIRED',
        openedAt: new Date('2026-09-01T10:00:00Z'),
        closedAt: new Date('2026-09-03T10:00:00Z'),
        charges: [{ amount: 450 }],
      },
      {
        id: 'job-2',
        stage: 'REPAIRING',
        openedAt: new Date('2026-10-01T10:00:00Z'),
        closedAt: null,
        charges: [{ amount: 1000 }],
      },
      {
        id: 'job-3',
        stage: 'CLOSED_NOT_REPAIRED',
        openedAt: new Date('2026-09-15T10:00:00Z'),
        closedAt: new Date('2026-09-16T10:00:00Z'),
        charges: [{ amount: 300 }],
      },
    ]

    const stats = aggregateCustomerStats(mockJobs)
    expect(stats.totalJobs).toBe(3)
    expect(stats.activeJobs).toBe(1) // REPAIRING
    expect(stats.completedJobs).toBe(2) // CLOSED_REPAIRED, CLOSED_NOT_REPAIRED
    expect(stats.totalSpendBaht).toBe(1750) // 450 + 1000 + 300
    expect(new Date(stats.firstSeenAt!).toISOString()).toBe(new Date('2026-09-01T10:00:00Z').toISOString())
    expect(new Date(stats.lastSeenAt!).toISOString()).toBe(new Date('2026-10-01T10:00:00Z').toISOString())
  })
})
