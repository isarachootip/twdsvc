// รายการงานสำหรับหน้า /jobs — ตาราง (กรองได้) แยกจากการ์ด SLA (นับจากงานที่ยังไม่ปิดทั้งหมด)
import type { Channel, JobStage, Prisma } from '@prisma/client'
import { prisma } from './db'
import { jobScope } from './api'
import type { UserSession } from './auth'
import { STAGE_ORDER } from './constants'
import { JOB_LIST_INCLUDE, serializeJob, type JobView } from './job-view'
import { SLA_CARD_FLAGS, computeSlaSummary, type SlaCardFlag, type SlaKpis } from './sla-summary'
import { isJobNoFormat } from './business-rules'

const bkkStart = (d: string) => new Date(`${d}T00:00:00+07:00`)
const bkkEnd = (d: string) => new Date(`${d}T23:59:59.999+07:00`)
const CLOSED: JobStage[] = ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED']

export interface JobsListResult {
  jobs: JobView[]
  kpis: SlaKpis | null
  total: number
}

function parseFlag(raw: string | null): SlaCardFlag | null {
  return SLA_CARD_FLAGS.find(f => f === raw) ?? null
}

function searchWhere(search: string): Prisma.JobWhereInput {
  const digits = search.replace(/\D/g, '')
  const contains = { contains: search, mode: 'insensitive' as const }
  return {
    OR: [
      { jobNo: contains },
      { customerName: contains },
      { productName: contains },
      { sku: contains },
      { receiverName: contains },
      { items: { some: { sku: contains } } },
      { vendorCenter: { code: contains } },
      { vendorCenter: { vendorParent: { name: contains } } },
      ...(digits.length >= 4 ? [{ customerPhone: { contains: digits } }] : []),
    ],
  }
}

export async function listJobs(user: UserSession, sp: URLSearchParams): Promise<JobsListResult> {
  const branchId = sp.get('branchId')
  const channelRaw = sp.get('channel')
  const channel = channelRaw === 'DC' || channelRaw === 'DSD' || channelRaw === 'TPL' ? (channelRaw as Channel) : null
  const flag = parseFlag(sp.get('flag'))

  // การ์ด: ไม่ขึ้นกับวันที่/สถานะ/คำค้น — ขึ้นกับสิทธิ์ผู้ใช้ + สาขา/ช่องทางที่เลือกเท่านั้น
  // ผู้เรียกที่ต้องการแค่รายการ (เช่น /s2, /tradein, export) ส่ง kpis=0 เพื่อข้ามการคำนวณ
  const needSummary = flag !== null || sp.get('kpis') !== '0'
  const summary = needSummary ? await computeSlaSummary(user, { branchId, channel }) : null

  const and: Prisma.JobWhereInput[] = [await jobScope(user)]
  const stages = (sp.get('stage') ?? '').split(',').filter(s => STAGE_ORDER.includes(s as never)) as JobStage[]
  if (stages.length) and.push({ stage: { in: stages } })
  const type = sp.get('type')
  if (type === 'CUSTOMER' || type === 'STOCK') and.push({ type })
  if (branchId) and.push({ branchId })
  if (channel) and.push({ channel })
  if (sp.get('open') === '1') and.push({ stage: { notIn: CLOSED } })
  const search = (sp.get('search') ?? '').trim()
  if (search) and.push(searchWhere(search))

  if (flag && summary) {
    // ดูรายการของการ์ด = งานเปิดทั้งหมดที่การ์ดนับ (ตรงกับตัวเลข) จึงไม่ใช้ช่วงวันที่
    and.push({ id: { in: summary.ids[flag] } })
  } else if (!isJobNoFormat(search)) {
    const from = sp.get('from')
    const to = sp.get('to')
    if (from) and.push({ openedAt: { gte: bkkStart(from) } })
    if (to) and.push({ openedAt: { lte: bkkEnd(to) } })
  }

  const limit = Math.min(1000, Math.max(1, Number(sp.get('limit') ?? '300')))
  const rows = await prisma.job.findMany({
    where: { AND: and },
    take: limit,
    orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
    include: JOB_LIST_INCLUDE,
  })
  const jobs = rows.map(j => serializeJob(j, user.role))
  return { jobs, kpis: summary?.counts ?? null, total: jobs.length }
}
