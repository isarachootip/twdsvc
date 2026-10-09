import { describe, it, expect } from '../framework/core'
import { fmtDateTime, fmtDate } from '../../src/lib/constants'

describe('Unit: Job Sorting by State Entry & System Date-Time Field', () => {
  it('formats system date-time with Thai day, month, 2-digit Buddhist year, and HH:mm', () => {
    // 2026-10-09 14:35:00 UTC+7
    const d = new Date('2026-10-09T14:35:00+07:00')
    const formatted = fmtDateTime(d)
    expect(formatted).toContain('09')
    expect(formatted).toContain('ต.ค.')
    expect(formatted).toContain('69')
    expect(formatted).toContain('14:35')
  })

  it('handles null and undefined safely in fmtDateTime', () => {
    expect(fmtDateTime(null)).toBe('-')
    expect(fmtDateTime(undefined)).toBe('-')
  })

  it('sorts jobs by latest stageEnteredAt descending (newest state entry first)', () => {
    const jobs = [
      { id: '1', jobNo: 'SSM-07102026-0001', stageEnteredAt: new Date('2026-10-07T10:00:00+07:00') },
      { id: '2', jobNo: 'SMP-06102026-0001', stageEnteredAt: new Date('2026-10-06T09:00:00+07:00') },
      { id: '3', jobNo: 'BNA-09102026-0003', stageEnteredAt: new Date('2026-10-09T15:30:00+07:00') },
      { id: '4', jobNo: 'BNA-09102026-0002', stageEnteredAt: new Date('2026-10-09T11:20:00+07:00') },
    ]

    // Default sorting logic: stageEnteredAt descending
    const sorted = [...jobs].sort((a, b) => {
      const av = a.stageEnteredAt ? new Date(a.stageEnteredAt).getTime() : 0
      const bv = b.stageEnteredAt ? new Date(b.stageEnteredAt).getTime() : 0
      return (av - bv) * -1 // dir: -1 (descending)
    })

    // Latest state entry (BNA-09102026-0003 at 15:30 on Oct 9) must be first
    expect(sorted[0].jobNo).toBe('BNA-09102026-0003')
    expect(sorted[1].jobNo).toBe('BNA-09102026-0002')
    expect(sorted[2].jobNo).toBe('SSM-07102026-0001')
    expect(sorted[3].jobNo).toBe('SMP-06102026-0001')
  })
})
