import { CLOSED_STAGES } from '@/lib/constants'
import type {
  CustomerDevice,
  DeviceRepairRecord,
} from '@/lib/validations/customer'

export function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/\D/g, '')
  if (cleaned.startsWith('66') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(2)
  }
  return cleaned
}

export interface RawJobRecord {
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

  const result: CustomerDevice[] = []
  for (const item of map.values()) {
    item.device.jobs.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())
    result.push(item.device)
  }

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
