// ตัวโหลดคิวงาน — ใช้ร่วมกันโดยหน้า /gr /cs /dc /vd (queueHandler) และการ์ด SLA ของ /jobs
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { jobScope } from './api'
import type { UserSession } from './auth'
import { JOB_LIST_INCLUDE, serializeJob, type JobView } from './job-view'
import { QUEUES } from './queue-defs'

export interface QueueFilters {
  from?: string | null
  to?: string | null
  branchId?: string | null
  vendorCenterId?: string | null
  channel?: string | null
}

export interface QueueOverdueItem {
  id: string
  jobNo: string
  customerName: string | null
  productName: string
  tab: string
  tabLabel: string
  stepName: string
  overHours: number
}

export interface QueueResult {
  tabs: Record<string, JobView[]>
  kpis: Record<string, number>
  labels: Record<string, string>
  overdue: QueueOverdueItem[]
}

function dateWhereOf(f: QueueFilters): Prisma.JobWhereInput {
  return {
    ...(f.from ? { openedAt: { gte: new Date(`${f.from}T00:00:00+07:00`) } } : {}),
    ...(f.to ? { AND: [{ openedAt: { lte: new Date(`${f.to}T23:59:59.999+07:00`) } }] } : {}),
  }
}

function filterWhereOf(f: QueueFilters): Prisma.JobWhereInput {
  return {
    ...(f.branchId ? { branchId: f.branchId } : {}),
    ...(f.vendorCenterId ? { vendorCenterId: f.vendorCenterId } : {}),
    ...(f.channel === 'DC' || f.channel === 'DSD' || f.channel === 'TPL' ? { channel: f.channel } : {}),
  }
}

/** Rows that belong in a tab after the post-query rules each page has always applied. */
function applyTabRules(dept: string, tabKey: string, rows: JobView[]): JobView[] {
  if (dept === 'GR' && tabKey === 'receive') return rows.filter(j => !j.intakeUnpaid)
  if (dept === 'CS' && tabKey === 'receive') return rows.filter(j => !j.location)
  if (dept === 'CS' && tabKey === 'pickup') return rows.filter(j => !!j.location)
  if (dept === 'CS' && tabKey === 'managerSign') return rows.filter(j => !j.quote?.managerSignedAt)
  if (dept === 'CS' && tabKey === 'approval') return rows.filter(j => !!j.quote?.managerSignedAt)
  return rows
}

function csOpenedScope(): Prisma.JobWhereInput {
  const startToday = new Date(new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10) + 'T00:00:00+07:00')
  return { OR: [{ openedAt: { gte: startToday } }, { payments: { some: { status: 'PENDING' } } }, { stage: 'PENDING_VENDOR_ASSIGNMENT' }] }
}

export async function loadQueueTabs(dept: keyof typeof QUEUES, user: UserSession, filters: QueueFilters): Promise<QueueResult> {
  const def = QUEUES[dept]
  const scope = await jobScope(user)
  const dateWhere = dateWhereOf(filters)
  const filterWhere = filterWhereOf(filters)
  const result: QueueResult = { tabs: {}, kpis: {}, labels: {}, overdue: [] }

  for (const t of def.tabs) {
    result.labels[t.key] = t.label
    const extraScope: Prisma.JobWhereInput = dept === 'CS' && t.key === 'opened' ? csOpenedScope() : {}
    const rows = await prisma.job.findMany({
      where: { AND: [scope, t.where, dateWhere, extraScope, filterWhere] },
      include: JOB_LIST_INCLUDE,
      orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
      take: 500,
    })
    const serialized = rows.map(r => serializeJob(r, user.role, { preferSla: t.sla }))
    const filtered = applyTabRules(dept, t.key, serialized)
    result.tabs[t.key] = filtered
    result.kpis[t.key] = filtered.length
    if (t.aliasKey) {
      result.tabs[t.aliasKey] = filtered
      result.kpis[t.aliasKey] = filtered.length
    }
    for (const j of filtered) {
      if (j.sla?.overdue) {
        result.overdue.push({
          id: j.id, jobNo: j.jobNo, customerName: j.customerName, productName: j.productName,
          tab: t.key, tabLabel: t.label, stepName: j.sla.stepName, overHours: j.sla.overHours,
        })
      }
    }
  }
  result.overdue.sort((a, b) => b.overHours - a.overHours)
  return result
}
