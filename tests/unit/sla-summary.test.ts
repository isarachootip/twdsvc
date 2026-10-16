import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import { runWithAuthToken } from '../../src/lib/auth'
import { GET as getDcQueue } from '../../src/app/api/queues/DC/route'
import { loadQueueTabs } from '../../src/lib/queue-loader'
import {
  OLD_OPENED_AT, cleanupSlaJobs, getJobs, getKpis, makeJob, queueOverdueCount, tokenFor,
} from '../framework/sla-fixtures'

setTier('Tier 1')

/** Run a test body and always remove the TST-SLA- jobs it created. */
async function withCleanup(body: () => Promise<void>): Promise<void> {
  await cleanupSlaJobs()
  try { await body() } finally { await cleanupSlaJobs() }
}

describe('Unit: SLA summary cards — queue-based, date-independent (Phase 2)', () => {
  it('SLASUM-01: an old overdue GR job is counted in the GR card even when the date range excludes it', () => withCleanup(async () => {
    const token = await tokenFor('test_am')
    const before = await getKpis(token)
    const job = await makeJob({ stage: 'GR_RECEIVED', stepCode: 'GR_PACK', openedAt: OLD_OPENED_AT, overdueHours: 500 })

    const noDates = await getJobs(token)
    const farRange = await getJobs(token, '?from=2099-01-01&to=2099-01-02')

    expect(noDates.kpis.GR).toBe(before.GR + 1)
    expect(farRange.kpis.GR).toBe(noDates.kpis.GR)
    expect(farRange.jobs.some(j => j.jobNo === job.jobNo)).toBe(false) // table still honours the date filter
  }))

  it('SLASUM-02: all six cards are identical for any date range', () => withCleanup(async () => {
    const token = await tokenFor('test_am')
    await makeJob({ stage: 'GR_RECEIVED', stepCode: 'GR_PACK', openedAt: OLD_OPENED_AT })
    await makeJob({ stage: 'VD_INSPECTING', stepCode: 'VD_QUOTE', openedAt: OLD_OPENED_AT })
    await makeJob({ stage: 'REPAIRING', decision: 'APPROVED', repairCharge: 5000, openedAt: OLD_OPENED_AT })

    const baseline = await getKpis(token)
    for (const qs of ['?from=2099-01-01&to=2099-01-02', '?from=2000-01-01&to=2000-01-02', '?from=2026-10-01']) {
      expect(await getKpis(token, qs)).toEqual(baseline)
    }
  }))

  it('SLASUM-03: GR / CS / VD cards equal the overdue count shown on /gr, /cs, /vd', () => withCleanup(async () => {
    const token = await tokenFor('test_am')
    await makeJob({ stage: 'GR_RECEIVED', stepCode: 'GR_PACK', openedAt: OLD_OPENED_AT })
    await makeJob({ stage: 'GR_PACKED', stepCode: 'GR_HANDOFF', openedAt: OLD_OPENED_AT })
    await makeJob({ stage: 'VD_INSPECTING', stepCode: 'VD_QUOTE', openedAt: OLD_OPENED_AT })
    await makeJob({ stage: 'WAITING_APPROVAL', stepCode: 'CUSTOMER_APPROVAL', openedAt: OLD_OPENED_AT })

    const kpis = await getKpis(token)
    expect(kpis.GR).toBe(await queueOverdueCount(token, 'GR'))
    expect(kpis.CS).toBe(await queueOverdueCount(token, 'CS'))
    expect(kpis.VD).toBe(await queueOverdueCount(token, 'VD'))
  }))

  it('SLASUM-04: parity still holds when the branch filter is applied on both sides', () => withCleanup(async () => {
    const token = await tokenFor('test_am')
    const sites = await prisma.site.findMany({ where: { active: true, type: 'BRANCH' }, take: 2 })
    const [a, b] = sites
    await makeJob({ stage: 'GR_RECEIVED', stepCode: 'GR_PACK', branchId: a.id, openedAt: OLD_OPENED_AT })
    await makeJob({ stage: 'GR_RECEIVED', stepCode: 'GR_PACK', branchId: b.id, openedAt: OLD_OPENED_AT })

    for (const site of [a, b]) {
      const qs = `?branchId=${site.id}`
      expect((await getKpis(token, qs)).GR).toBe(await queueOverdueCount(token, 'GR', qs))
    }
  }))

  it('SLASUM-05: closed and cancelled jobs are never counted, even with a stale running clock', () => withCleanup(async () => {
    const token = await tokenFor('test_am')
    const before = await getKpis(token)
    await makeJob({ stage: 'CLOSED_REPAIRED', stepCode: 'GR_PACK', openedAt: OLD_OPENED_AT })
    await makeJob({ stage: 'CANCELLED', stepCode: 'GR_PACK', openedAt: OLD_OPENED_AT })

    const after = await getKpis(token)
    expect(after.GR).toBe(before.GR)
    expect(after.total).toBe(before.total)
    expect(after.overdue).toBe(before.overdue)
  }))

  it('SLASUM-06: the "total" card is every open job, regardless of when it was opened', () => withCleanup(async () => {
    const token = await tokenFor('test_am')
    const before = await getKpis(token)
    await makeJob({ stage: 'REPAIRING', openedAt: OLD_OPENED_AT })
    await makeJob({ stage: 'GR_RECEIVED', openedAt: new Date() })
    await makeJob({ stage: 'CLOSED_NOT_REPAIRED', openedAt: new Date() })

    expect((await getKpis(token)).total).toBe(before.total + 2)
  }))

  it('SLASUM-07: like /gr, a job still waiting for intake payment is not a GR overdue; a paid one is', () => withCleanup(async () => {
    const token = await tokenFor('test_am')
    const before = await getKpis(token)
    await makeJob({ stage: 'CS_OPENED', stepCode: 'CS_HANDOVER', intakeFee: 150, openedAt: OLD_OPENED_AT })
    expect((await getKpis(token)).GR).toBe(before.GR)

    await makeJob({ stage: 'CS_OPENED', stepCode: 'CS_HANDOVER', openedAt: OLD_OPENED_AT })
    const after = await getKpis(token)
    expect(after.GR).toBe(before.GR + 1)
    expect(after.GR).toBe(await queueOverdueCount(token, 'GR'))
  }))

  it('SLASUM-08: unpaid card counts approved jobs with a balance and also reports the total amount', () => withCleanup(async () => {
    const token = await tokenFor('test_am')
    const before = await getKpis(token)
    await makeJob({ stage: 'REPAIRING', decision: 'APPROVED', repairCharge: 123400, openedAt: OLD_OPENED_AT })
    await makeJob({ stage: 'REPAIRING', decision: 'PENDING', repairCharge: 99900, openedAt: OLD_OPENED_AT })

    const after = await getKpis(token, '?from=2099-01-01&to=2099-01-02')
    expect(after.unpaid).toBe(before.unpaid + 1)
    expect(after.unpaidAmount).toBe(before.unpaidAmount + 123400)
  }))

  it('SLASUM-09: a GR user only counts jobs in their own branch', () => withCleanup(async () => {
    const token = await tokenFor('test_gr')
    const gr = await prisma.user.findUniqueOrThrow({ where: { username: 'test_gr' } })
    const other = await prisma.site.findFirstOrThrow({ where: { active: true, type: 'BRANCH', id: { not: gr.siteId ?? '' } } })
    const before = await getKpis(token)

    await makeJob({ stage: 'GR_RECEIVED', stepCode: 'GR_PACK', branchId: other.id, openedAt: OLD_OPENED_AT })
    expect((await getKpis(token)).GR).toBe(before.GR)

    await makeJob({ stage: 'GR_RECEIVED', stepCode: 'GR_PACK', branchId: gr.siteId ?? '', openedAt: OLD_OPENED_AT })
    expect((await getKpis(token)).GR).toBe(before.GR + 1)
  }))

  it('SLASUM-10: the shared queue loader returns the same overdue list the /dc page serves', () => withCleanup(async () => {
    const token = await tokenFor('test_am')
    const admin = await prisma.user.findUniqueOrThrow({ where: { username: 'test_am' } })
    await makeJob({ stage: 'AT_DC_OUTBOUND', channel: 'DC', stepCode: 'VD_PICKUP_AT_DC', openedAt: OLD_OPENED_AT })

    const fromLoader = await loadQueueTabs('DC', {
      id: admin.id, username: admin.username, fullName: admin.fullName, role: admin.role,
      siteId: admin.siteId, vendorCenterId: admin.vendorCenterId,
    }, {})
    const fromRoute = await runWithAuthToken(token, async () => {
      const res = await getDcQueue(new Request('http://localhost:3000/api/queues/DC'))
      return (await res.json()) as { overdue: unknown[] }
    })
    expect(fromLoader.overdue.length).toBe(fromRoute.overdue.length)
    expect(fromLoader.overdue.length).toBeGreaterThan(0)
  }))
})
