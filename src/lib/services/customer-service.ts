import { prisma } from '@/lib/db'
import { CLOSED_STAGES } from '@/lib/constants'
import type {
  CustomerSummary,
  CustomerDevice,
  DeviceRepairRecord,
  CustomerDetailProfile,
} from '@/lib/validations/customer'

export function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/\D/g, '')
  if (cleaned.startsWith('66') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(2)
  }
  return cleaned
}

interface RawJobRecord {
  id: string
  jobNo: string
  stage: string
  brandName: string
  productName: string
  serialNo?: string | null
  sku?: string | null
  openedAt: Date
  closedAt?: Date | null
  symptom?: string | null
  hasWarranty: boolean
  branch?: { name: string } | null
  charges?: Array<{ amount: number }>
}

export function groupJobsByDevice(jobs: RawJobRecord[]): CustomerDevice[] {
  const map = new Map<string, { device: CustomerDevice; rawJobs: RawJobRecord[] }>()

  for (const job of jobs) {
    const sNo = job.serialNo?.trim() || ''
    const key = sNo ? `SN:${sNo.toUpperCase()}` : `PROD:${job.brandName}_${job.productName}_${job.id}`

    const repairRecord: DeviceRepairRecord = {
      jobId: job.id,
      jobNo: job.jobNo,
      stage: job.stage,
      openedAt: job.openedAt,
      closedAt: job.closedAt ?? null,
      branchName: job.branch?.name ?? '-',
      symptom: job.symptom ?? null,
      hasWarranty: job.hasWarranty,
      totalCharges: (job.charges ?? []).reduce((acc, c) => acc + c.amount, 0),
    }

    const existing = map.get(key)
    if (existing) {
      existing.device.repairCount += 1
      if (new Date(job.openedAt) > new Date(existing.device.lastRepairedAt)) {
        existing.device.lastRepairedAt = job.openedAt
      }
      existing.device.jobs.push(repairRecord)
      existing.rawJobs.push(job)
    } else {
      map.set(key, {
        device: {
          deviceKey: key,
          serialNo: sNo || null,
          brandName: job.brandName,
          productName: job.productName,
          sku: job.sku ?? null,
          repairCount: 1,
          lastRepairedAt: job.openedAt,
          jobs: [repairRecord],
        },
        rawJobs: [job],
      })
    }
  }

  // Sort each device's jobs by openedAt desc
  const result: CustomerDevice[] = []
  for (const item of map.values()) {
    item.device.jobs.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())
    result.push(item.device)
  }

  // Sort devices by lastRepairedAt desc
  return result.sort((a, b) => new Date(b.lastRepairedAt).getTime() - new Date(a.lastRepairedAt).getTime())
}

export function aggregateCustomerStats(jobs: Array<{
  id: string
  stage: string
  openedAt: Date
  closedAt?: Date | null
  charges?: Array<{ amount: number }>
}>) {
  let activeJobs = 0
  let completedJobs = 0
  let totalSpend = 0
  let firstSeen: Date | null = null
  let lastSeen: Date | null = null

  for (const j of jobs) {
    const isClosed = CLOSED_STAGES.includes(j.stage as any)
    if (isClosed) completedJobs += 1
    else activeJobs += 1

    for (const c of j.charges ?? []) {
      totalSpend += c.amount
    }

    const d = new Date(j.openedAt)
    if (!firstSeen || d < firstSeen) firstSeen = d
    if (!lastSeen || d > lastSeen) lastSeen = d
  }

  return {
    totalJobs: jobs.length,
    activeJobs,
    completedJobs,
    totalSpendBaht: totalSpend >= 1000 && totalSpend % 100 === 0 ? totalSpend / 100 : totalSpend,
    firstSeenAt: firstSeen,
    lastSeenAt: lastSeen,
  }
}

export async function searchCustomerDirectory(query: string, page = 1, limit = 20): Promise<{
  customers: CustomerSummary[]
  total: number
}> {
  const qClean = query.trim()
  const qPhone = normalizePhoneNumber(qClean)

  const whereClause: any = {
    type: 'CUSTOMER',
    customerPhone: { not: null },
  }

  if (qClean) {
    whereClause.OR = [
      ...(qPhone ? [{ customerPhone: { contains: qPhone } }] : []),
      { customerName: { contains: qClean, mode: 'insensitive' } },
      { serialNo: { contains: qClean, mode: 'insensitive' } },
    ]
  }

  const jobs = await prisma.job.findMany({
    where: whereClause,
    orderBy: { openedAt: 'desc' },
    select: {
      customerPhone: true,
      customerName: true,
      stage: true,
      openedAt: true,
      productName: true,
      brandName: true,
      serialNo: true,
      branch: { select: { name: true } },
    },
    take: 500, // Aggregate recent jobs
  })

  const groupMap = new Map<string, {
    phone: string
    name: string
    jobs: typeof jobs
  }>()

  for (const j of jobs) {
    const p = normalizePhoneNumber(j.customerPhone || '')
    if (!p) continue
    if (!groupMap.has(p)) {
      groupMap.set(p, { phone: p, name: j.customerName || 'ไม่ระบุชื่อ', jobs: [] })
    }
    groupMap.get(p)!.jobs.push(j)
  }

  const aggregatedList: CustomerSummary[] = []
  for (const [phone, item] of groupMap.entries()) {
    const activeCount = item.jobs.filter(x => !CLOSED_STAGES.includes(x.stage as any)).length
    const uniqueProducts = new Set(item.jobs.map(x => x.serialNo || `${x.brandName}_${x.productName}`)).size
    aggregatedList.push({
      phone,
      name: item.name,
      jobCount: item.jobs.length,
      activeJobCount: activeCount,
      lastVisitedAt: item.jobs[0]?.openedAt ?? null,
      lastBranchName: item.jobs[0]?.branch?.name ?? null,
      productCount: uniqueProducts,
    })
  }

  const offset = (page - 1) * limit
  const paginated = aggregatedList.slice(offset, offset + limit)

  return { customers: paginated, total: aggregatedList.length }
}

export async function getCustomerDetail(phone: string): Promise<CustomerDetailProfile | null> {
  const normPhone = normalizePhoneNumber(phone)
  if (!normPhone) return null

  const jobs = await prisma.job.findMany({
    where: {
      type: 'CUSTOMER',
      customerPhone: { contains: normPhone },
    },
    orderBy: { openedAt: 'desc' },
    include: {
      branch: { select: { name: true } },
      charges: { select: { amount: true } },
    },
  })

  if (jobs.length === 0) return null

  const latest = jobs[0]
  const devices = groupJobsByDevice(jobs as any)
  const stats = aggregateCustomerStats(jobs)

  return {
    phone: normPhone,
    name: latest.customerName || 'ไม่ระบุชื่อ',
    address: latest.customerAddress ?? null,
    zip: latest.customerZip ?? null,
    taxInvoiceName: latest.taxInvoiceName ?? null,
    taxInvoiceId: latest.taxInvoiceId ?? null,
    taxInvoiceAddr: latest.taxInvoiceAddr ?? null,
    stats,
    devices,
  }
}
