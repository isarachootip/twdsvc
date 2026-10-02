import { prisma } from '@/lib/db'
import { CLOSED_STAGES } from '@/lib/constants'
import type {
  CustomerSummary,
  CustomerDetailProfile,
} from '@/lib/validations/customer'
import {
  normalizePhoneNumber,
  groupJobsByDevice,
  aggregateCustomerStats,
} from './customer-aggregation'

export {
  normalizePhoneNumber,
  groupJobsByDevice,
  aggregateCustomerStats,
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
    take: 500,
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
