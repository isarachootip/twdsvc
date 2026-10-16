import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import { isJobNoFormat } from '../../src/lib/business-rules'
import { findJobTab, findJobsByScan } from '../../src/lib/job-locator'
import { listJobs } from '../../src/lib/jobs-list'

setTier('Tier 1')

describe('Phase 3.3 — Job Number Standard Format & Dual-Format Search', () => {
  it('JN-01: isJobNoFormat recognizes both new standard (BNA-11102026-0001) and legacy (JB-2610-00001, STK-2610-0001) formats', () => {
    expect(isJobNoFormat('BNA-11102026-0001')).toBe(true)
    expect(isJobNoFormat('SK3-05092026-0123')).toBe(true)
    expect(isJobNoFormat('60920-11102026-0001')).toBe(true)
    expect(isJobNoFormat('JB-2610-00001')).toBe(true)
    expect(isJobNoFormat('JB-2609-0012')).toBe(true)
    expect(isJobNoFormat('STK-2610-00001')).toBe(true)
    expect(isJobNoFormat('สมชาย ใจดี')).toBe(false)
    expect(isJobNoFormat('0812345678')).toBe(false)
  })

  it('JN-02: findJobTab and findJobsByScan locate both JB-xxxx-xxxxx and BNA-DDMMYYYY-xxxx job numbers', () => {
    const tabs = {
      receive: [{ id: 'j_old', jobNo: 'JB-2610-00001' }],
      pack: [{ id: 'j_new', jobNo: 'BNA-11102026-0001' }],
    }
    const keys = ['receive', 'pack'] as const

    expect(findJobTab(tabs, keys, 'JB-2610-00001')).toEqual({ tab: 'receive', jobId: 'j_old' })
    expect(findJobTab(tabs, keys, 'bna-11102026-0001')).toEqual({ tab: 'pack', jobId: 'j_new' })
    expect(findJobsByScan(tabs, keys, 'JB-2610-00001')?.jobIds).toEqual(['j_old'])
    expect(findJobsByScan(tabs, keys, 'BNA-11102026-0001')?.jobIds).toEqual(['j_new'])
  })

  it('JN-03: listJobs finds both legacy JB-2609-xxxxx and new BNA-11102026-xxxx jobs even when date range is October', async () => {
    const branch = await prisma.site.findFirstOrThrow({ where: { type: 'BRANCH', active: true } })
    const admin = await prisma.user.findUniqueOrThrow({ where: { username: 'test_am' } })
    const session = {
      id: admin.id, username: admin.username, fullName: admin.fullName,
      role: admin.role, siteId: null, vendorCenterId: null,
    }

    const suffix = String(Date.now()).slice(-5)
    const oldNo = `JB-2609-${suffix}`
    const newNo = `BNA-11092026-${suffix.slice(-4)}`
    const sepDate = new Date('2026-09-11T03:00:00Z')

    const [jOld, jNew] = await Promise.all([
      prisma.job.create({
        data: {
          jobNo: oldNo, type: 'CUSTOMER', stage: 'GR_RECEIVED', branchId: branch.id,
          customerName: 'ลูกค้าเก่า ก.ย.', customerPhone: '0812223333',
          productName: 'แอร์', brandName: 'LG', createdBy: 'BNACS',
          openedAt: sepDate, stageEnteredAt: sepDate,
        },
      }),
      prisma.job.create({
        data: {
          jobNo: newNo, type: 'CUSTOMER', stage: 'GR_RECEIVED', branchId: branch.id,
          customerName: 'ลูกค้าใหม่ ก.ย.', customerPhone: '0812224444',
          productName: 'ทีวี', brandName: 'LG', createdBy: 'BNACS',
          openedAt: sepDate, stageEnteredAt: sepDate,
        },
      }),
    ])

    try {
      const spOld = new URLSearchParams({ from: '2026-10-01', to: '2026-10-16', search: oldNo, kpis: '0' })
      const resOld = await listJobs(session, spOld)
      expect(resOld.jobs.some(j => j.id === jOld.id)).toBe(true)

      const spNew = new URLSearchParams({ from: '2026-10-01', to: '2026-10-16', search: newNo, kpis: '0' })
      const resNew = await listJobs(session, spNew)
      expect(resNew.jobs.some(j => j.id === jNew.id)).toBe(true)
    } finally {
      await prisma.job.deleteMany({ where: { id: { in: [jOld.id, jNew.id] } } })
    }
  })
})
