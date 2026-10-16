import { describe, it, expect, setTier } from '../framework/core'
import { NextRequest } from 'next/server'
import { prisma } from '../../src/lib/db'
import { signAccessToken, runWithAuthToken } from '../../src/lib/auth'
import { computeSlaSummary } from '../../src/lib/sla-summary'
import { loadQueueTabs } from '../../src/lib/queue-loader'
import { listJobs } from '../../src/lib/jobs-list'
import { loadClosedJobs, openJobs } from '../../src/lib/reports'
import { GET as getVdPaymentRoute } from '../../src/app/api/reports/vd-payment/route'
import { GET as getOverviewRoute } from '../../src/app/api/reports/overview/route'
import { GET as getExecutiveRoute } from '../../src/app/api/reports/executive/route'

setTier('Tier 1')

describe('Phase 3.1 — Exclude isTest=true Jobs from SLA, Dashboard, Executive, and VD Payout', () => {
  it('ITE-01: isTest=true open overdue job is excluded from computeSlaSummary, loadQueueTabs, listJobs, and openJobs', async () => {
    const branch = await prisma.site.findFirstOrThrow({ where: { type: 'BRANCH', active: true } })
    const vc = await prisma.vendorCenter.findFirstOrThrow({ where: { active: true } })
    const stepGr = await prisma.slaStep.findFirstOrThrow({ where: { code: 'GR_PACK' } })
    const admin = await prisma.user.findUniqueOrThrow({ where: { username: 'test_am' } })
    const session = {
      id: admin.id, username: admin.username, fullName: admin.fullName,
      role: admin.role, siteId: null, vendorCenterId: null,
    }

    const beforeSla = await computeSlaSummary(session, { branchId: branch.id })
    const beforeQueue = await loadQueueTabs('GR', session, { branchId: branch.id })
    const beforeOpen = await openJobs({ branchId: branch.id })

    const past = new Date(Date.now() - 48 * 3600000)
    const testJob = await prisma.job.create({
      data: {
        jobNo: `TEST-EX-${Date.now()}`,
        type: 'CUSTOMER',
        stage: 'GR_RECEIVED',
        channel: 'DC',
        branchId: branch.id,
        vendorCenterId: vc.id,
        customerName: 'test test',
        customerPhone: '0810000000',
        productName: 'เครื่องซักผ้าทดสอบ',
        brandName: 'Hitachi',
        createdBy: 'test_am',
        isTest: true,
        openedAt: past,
        stageEnteredAt: past,
      },
    })
    await prisma.slaClock.create({
      data: {
        jobId: testJob.id,
        slaStepId: stepGr.id,
        status: 'RUNNING',
        startedAt: past,
        dueAt: new Date(Date.now() - 24 * 3600000),
        breached: true,
      },
    })

    try {
      const afterSla = await computeSlaSummary(session, { branchId: branch.id })
      const afterQueue = await loadQueueTabs('GR', session, { branchId: branch.id })
      const afterOpen = await openJobs({ branchId: branch.id })
      const listed = await listJobs(session, new URLSearchParams({ branchId: branch.id }))

      expect(afterSla.counts.total).toBe(beforeSla.counts.total)
      expect(afterSla.counts.GR).toBe(beforeSla.counts.GR)
      expect(afterQueue.overdue.some(o => o.id === testJob.id)).toBe(false)
      expect(afterOpen.some(j => j.id === testJob.id)).toBe(false)
      expect(listed.jobs.some(j => j.id === testJob.id)).toBe(false)
    } finally {
      await prisma.job.delete({ where: { id: testJob.id } })
    }
  })

  it('ITE-02: isTest=true closed repaired job is excluded from Dashboard, Executive, and VD Payment report', async () => {
    const branch = await prisma.site.findFirstOrThrow({ where: { type: 'BRANCH', active: true } })
    const vc = await prisma.vendorCenter.findFirstOrThrow({ where: { active: true } })
    const admin = await prisma.user.findUniqueOrThrow({ where: { username: 'test_am' } })
    const token = await signAccessToken({
      id: admin.id, username: admin.username, fullName: admin.fullName,
      role: admin.role, siteId: null, vendorCenterId: null,
    })

    const now = new Date()
    const todayStr = new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10)
    const testJob = await prisma.job.create({
      data: {
        jobNo: `TEST-CLOSED-${Date.now()}`,
        type: 'CUSTOMER',
        stage: 'CLOSED_REPAIRED',
        decision: 'APPROVED',
        channel: 'DC',
        branchId: branch.id,
        vendorCenterId: vc.id,
        customerName: 'tee tee',
        customerPhone: '0810000001',
        productName: 'ตู้เย็นทดสอบ',
        brandName: 'Samsung',
        createdBy: 'test_am',
        isTest: true,
        openedAt: now,
        closedAt: now,
      },
    })
    await prisma.quote.create({
      data: {
        jobId: testJob.id,
        quoteNo: `QT-TEST-${Date.now()}`,
        version: 1,
        status: 'APPROVED',
        subtotal: 500000,
        vatAmount: 35000,
        total: 535000,
        repairDays: 3,
        repairWarrantyDays: 30,
        expiresAt: new Date(now.getTime() + 7 * 86400000),
        createdBy: 'test_am',
      },
    })

    try {
      const closedList = await loadClosedJobs(new Date(now.getTime() - 3600000), new Date(now.getTime() + 3600000))
      expect(closedList.some(j => j.id === testJob.id)).toBe(false)

      await runWithAuthToken(token, async () => {
        const headers = { authorization: `Bearer ${token}` }
        const vdRes = await getVdPaymentRoute(
          new NextRequest(`http://localhost:3000/api/reports/vd-payment?from=${todayStr}&to=${todayStr}`, { headers })
        )
        const vdData = await vdRes.json()
        expect(vdData.rows.some((r: { id: string }) => r.id === testJob.id)).toBe(false)

        const ovRes = await getOverviewRoute(new NextRequest('http://localhost:3000/api/reports/overview?period=weekly', { headers }))
        expect(ovRes.status).toBe(200)
        const exRes = await getExecutiveRoute(new NextRequest('http://localhost:3000/api/reports/executive?period=month', { headers }))
        expect(exRes.status).toBe(200)
      })
    } finally {
      await prisma.job.delete({ where: { id: testJob.id } })
    }
  })
})
