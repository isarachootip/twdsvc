// สรุปการ์ด SLA ของหน้า /jobs — คำนวณจาก "งานที่ยังไม่ปิดทั้งหมด" ไม่ขึ้นกับช่วงวันที่ของตาราง
//  - CS / GR / VD : นับตามคิวที่งานนั่งอยู่ (ใช้ loadQueueTabs ตัวเดียวกับหน้า /cs /gr /vd)
//  - transport / overdue : นับตามเจ้าของนาฬิกา SLA (jobSla) บนงานที่ยังไม่ปิด
//  - unpaid : งานที่อนุมัติซ่อมแล้วแต่ยังมียอดค้างชำระ
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { jobScope } from './api'
import type { UserSession } from './auth'
import { CLOSED_STAGES } from './constants'
import { calcMoney, jobSla } from './job-view'
import { loadQueueTabs } from './queue-loader'

export const SLA_CARD_FLAGS = ['CS', 'GR', 'VD', 'transport', 'unpaid', 'overdue'] as const
export type SlaCardFlag = (typeof SLA_CARD_FLAGS)[number]

/** เจ้าของนาฬิกา SLA ที่นับเป็น "ขนส่ง" */
export const TRANSPORT_OWNERS: readonly string[] = ['DC', 'TPL', 'CARRIER']

export interface SlaKpis {
  total: number
  CS: number
  GR: number
  VD: number
  transport: number
  unpaid: number
  unpaidAmount: number
  overdue: number
}

export interface SlaSummary {
  counts: SlaKpis
  /** id ของงานต่อการ์ด — ใช้ตอนกดการ์ดเพื่อดูรายการ */
  ids: Record<SlaCardFlag, string[]>
}

export interface SlaSummaryFilters {
  branchId?: string | null
  channel?: string | null
}

const CLOCK_SELECT = {
  where: { status: { not: 'STOPPED' as const } },
  include: { slaStep: { select: { id: true, seq: true, code: true, name: true, ownerDept: true, hours: true } } },
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)]
}

async function openJobsWhere(user: UserSession, f: SlaSummaryFilters): Promise<Prisma.JobWhereInput[]> {
  const where: Prisma.JobWhereInput[] = [await jobScope(user), { isTest: false, stage: { notIn: CLOSED_STAGES } }]
  if (f.branchId) where.push({ branchId: f.branchId })
  if (f.channel === 'DC' || f.channel === 'DSD' || f.channel === 'TPL') where.push({ channel: f.channel })
  return where
}

async function queueOverdue(dept: 'CS' | 'GR' | 'VD', user: UserSession, f: SlaSummaryFilters) {
  const { overdue } = await loadQueueTabs(dept, user, { branchId: f.branchId, channel: f.channel })
  return { count: overdue.length, ids: unique(overdue.map(o => o.id)) }
}

async function clockOverdue(and: Prisma.JobWhereInput[], now: Date) {
  const rows = await prisma.job.findMany({
    where: { AND: [...and, { slaClocks: { some: { status: 'RUNNING', dueAt: { lt: now } } } }] },
    select: { id: true, channel: true, slaClocks: CLOCK_SELECT },
  })
  const overdueIds: string[] = []
  const transportIds: string[] = []
  for (const r of rows) {
    const sla = jobSla(r, undefined, now)
    if (!sla.overdue) continue
    overdueIds.push(r.id)
    if (TRANSPORT_OWNERS.includes(sla.overdueOwner ?? '')) transportIds.push(r.id)
  }
  return { overdueIds, transportIds }
}

async function unpaidJobs(and: Prisma.JobWhereInput[]) {
  const rows = await prisma.job.findMany({
    where: { AND: [...and, { type: 'CUSTOMER', decision: { in: ['APPROVED', 'AUTO_APPROVED'] } }] },
    select: {
      id: true,
      charges: { select: { amount: true, type: true } },
      payments: { select: { amount: true, status: true, chargeType: true, method: true } },
    },
  })
  const ids: string[] = []
  let amount = 0
  for (const r of rows) {
    const { balance } = calcMoney(r)
    if (balance > 0) {
      ids.push(r.id)
      amount += balance
    }
  }
  return { ids, amount }
}

export async function computeSlaSummary(user: UserSession, filters: SlaSummaryFilters = {}, now = new Date()): Promise<SlaSummary> {
  const and = await openJobsWhere(user, filters)
  const [total, gr, cs, vd, clocks, unpaid] = await Promise.all([
    prisma.job.count({ where: { AND: and } }),
    queueOverdue('GR', user, filters),
    queueOverdue('CS', user, filters),
    queueOverdue('VD', user, filters),
    clockOverdue(and, now),
    unpaidJobs(and),
  ])
  return {
    counts: {
      total, CS: cs.count, GR: gr.count, VD: vd.count,
      transport: clocks.transportIds.length,
      unpaid: unpaid.ids.length, unpaidAmount: unpaid.amount,
      overdue: clocks.overdueIds.length,
    },
    ids: { CS: cs.ids, GR: gr.ids, VD: vd.ids, transport: clocks.transportIds, unpaid: unpaid.ids, overdue: clocks.overdueIds },
  }
}
