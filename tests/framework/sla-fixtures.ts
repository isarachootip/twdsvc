import { NextRequest } from 'next/server'
import type { Channel, JobStage, QuoteDecision } from '@prisma/client'
import { prisma } from '../../src/lib/db'
import { signAccessToken, runWithAuthToken } from '../../src/lib/auth'
import { GET as getJobsRoute } from '../../src/app/api/jobs/route'
import { GET as getGrQueue } from '../../src/app/api/queues/GR/route'
import { GET as getCsQueue } from '../../src/app/api/queues/CS/route'
import { GET as getVdQueue } from '../../src/app/api/queues/VD/route'

/** Fixtures for SLA summary / queue parity tests (real local DB, cleaned up per test). */
export const SLA_TEST_PREFIX = 'TST-SLA-'
export const OLD_OPENED_AT = new Date('2026-01-15T03:00:00Z')

export interface Kpis {
  total: number
  CS: number
  GR: number
  VD: number
  transport: number
  unpaid: number
  unpaidAmount: number
  overdue: number
}

interface JobRow { jobNo: string }
interface QueueBody { overdue: unknown[] }

export interface MakeJobOptions {
  stage: JobStage
  stepCode?: string
  channel?: Channel
  branchId?: string
  openedAt?: Date
  overdueHours?: number
  intakeFee?: number
  repairCharge?: number
  decision?: QuoteDecision
}

export async function tokenFor(username: string): Promise<string> {
  const u = await prisma.user.findUniqueOrThrow({ where: { username } })
  return signAccessToken({
    id: u.id, username: u.username, fullName: u.fullName, role: u.role,
    siteId: u.siteId, vendorCenterId: u.vendorCenterId,
  })
}

export async function makeJob(o: MakeJobOptions) {
  const branch = o.branchId
    ? await prisma.site.findUniqueOrThrow({ where: { id: o.branchId } })
    : await prisma.site.findFirstOrThrow({ where: { active: true, type: 'BRANCH' } })
  const brand = await prisma.brand.findFirstOrThrow()
  const vendorCenter = await prisma.vendorCenter.findFirst({ where: { active: true } })
  const job = await prisma.job.create({
    data: {
      jobNo: `${SLA_TEST_PREFIX}${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 100000)}`,
      type: 'CUSTOMER', stage: o.stage, channel: o.channel ?? 'DC',
      branchId: branch.id, vendorCenterId: vendorCenter?.id,
      customerName: 'ลูกค้าทดสอบ SLA', productName: 'สินค้าทดสอบ SLA',
      brandId: brand.id, brandName: brand.name, createdBy: 'test-runner',
      openedAt: o.openedAt ?? new Date(), decision: o.decision ?? 'PENDING',
    },
  })
  if (o.intakeFee) await prisma.jobCharge.create({ data: { jobId: job.id, type: 'OPERATION_FEE', amount: o.intakeFee } })
  if (o.repairCharge) await prisma.jobCharge.create({ data: { jobId: job.id, type: 'REPAIR', amount: o.repairCharge } })
  if (o.stepCode) {
    const step = await prisma.slaStep.findUniqueOrThrow({ where: { code: o.stepCode } })
    const dueAt = new Date(Date.now() - (o.overdueHours ?? 100) * 3600000)
    await prisma.slaClock.create({
      data: { jobId: job.id, slaStepId: step.id, status: 'RUNNING', startedAt: new Date(dueAt.getTime() - 24 * 3600000), dueAt },
    })
  }
  return job
}

export async function cleanupSlaJobs(): Promise<void> {
  await prisma.job.deleteMany({ where: { jobNo: { startsWith: SLA_TEST_PREFIX } } })
}

export async function getJobs(token: string, qs = ''): Promise<{ jobs: JobRow[]; kpis: Kpis }> {
  return runWithAuthToken(token, async () => {
    const res = await getJobsRoute(new NextRequest(`http://localhost:3000/api/jobs${qs}`))
    return (await res.json()) as { jobs: JobRow[]; kpis: Kpis }
  })
}

export async function getKpis(token: string, qs = ''): Promise<Kpis> {
  return (await getJobs(token, qs)).kpis
}

const QUEUE_ROUTES = { GR: getGrQueue, CS: getCsQueue, VD: getVdQueue } as const

export async function queueOverdueCount(token: string, dept: keyof typeof QUEUE_ROUTES, qs = ''): Promise<number> {
  return runWithAuthToken(token, async () => {
    const res = await QUEUE_ROUTES[dept](new Request(`http://localhost:3000/api/queues/${dept}${qs}`))
    return ((await res.json()) as QueueBody).overdue.length
  })
}
