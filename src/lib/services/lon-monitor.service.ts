import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getIntegrationConfig } from '@/lib/services/integration-config.service'
import { lonHttpRequest } from '@/lib/services/lon-http-client'
import {
  LON_DEFAULT_BASE_URL,
  LON_DELIVERY_STATUSES,
  LON_NOTIFICATION_TYPES,
  orderLonPayloadBySwagger,
  type LonStatus,
  type LonType,
} from '@/lib/validations/lon.schema'

export const lonMonitorQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(''),
  status: z.enum(LON_DELIVERY_STATUSES).optional(),
  type: z.enum(LON_NOTIFICATION_TYPES).optional(),
  from: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(300).optional().default(100),
})

export type LonMonitorQuery = z.infer<typeof lonMonitorQuerySchema>

export interface LonMonitorLogItem {
  id: string; jobId: string; jobNo: string
  customerName: string | null; productName: string; branchName: string
  type: LonType; endpoint: string; recipientPhone: string
  status: LonStatus; httpStatus: number | null
  requestPayload: unknown; responseBody: string | null
  errorMessage: string | null; triggeredBy: string | null; createdAt: string
}

export interface LonMonitorSummary {
  total: number; sent: number; simulated: number; skipped: number; failed: number
  byType: Record<LonType, { total: number; sent: number; failed: number }>
}

export interface LonMonitorReportResult {
  summary: LonMonitorSummary
  logs: LonMonitorLogItem[]
}

export interface RemoteLonRecord {
  id: number; repair_no: string; customer_name: string; customer_phone: string
  product_name: string | null; repair_reason: string | null; store_name: string | null
  status: string | null; line_status: string | null; repair_date: string | null
  repair_price: string | number | null; rate: string | number | null; comment: string | null
  created_at: string | null; updated_at: string | null
}

function buildWhereClause(q: LonMonitorQuery): Prisma.LonNotificationLogWhereInput {
  const where: Prisma.LonNotificationLogWhereInput = {}
  if (q.status) where.status = q.status
  if (q.type) where.type = q.type

  if (q.from || q.to) {
    where.createdAt = {
      ...(q.from ? { gte: new Date(`${q.from}T00:00:00.000+07:00`) } : {}),
      ...(q.to ? { lte: new Date(`${q.to}T23:59:59.999+07:00`) } : {}),
    }
  }

  if (q.search) {
    const s = q.search
    where.OR = [
      { recipientPhone: { contains: s, mode: 'insensitive' } },
      { endpoint: { contains: s, mode: 'insensitive' } },
      { job: { jobNo: { contains: s, mode: 'insensitive' } } },
      { job: { customerName: { contains: s, mode: 'insensitive' } } },
    ]
  }
  return where
}

export async function getLonMonitorReport(rawQuery: Partial<LonMonitorQuery> = {}): Promise<LonMonitorReportResult> {
  const q = lonMonitorQuerySchema.parse(rawQuery)
  const where = buildWhereClause(q)

  const rows = await prisma.lonNotificationLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: q.limit,
    include: {
      job: {
        select: {
          jobNo: true,
          customerName: true,
          productName: true,
          branch: { select: { name: true } },
        },
      },
    },
  })

  const byType = Object.fromEntries(
    LON_NOTIFICATION_TYPES.map((t) => [t, { total: 0, sent: 0, failed: 0 }])
  ) as Record<LonType, { total: number; sent: number; failed: number }>

  const summary: LonMonitorSummary = {
    total: rows.length,
    sent: 0,
    simulated: 0,
    skipped: 0,
    failed: 0,
    byType,
  }

  const logs: LonMonitorLogItem[] = rows.map((r) => {
    if (r.status === 'SENT') summary.sent += 1
    else if (r.status === 'SIMULATED') summary.simulated += 1
    else if (r.status === 'SKIPPED') summary.skipped += 1
    else if (r.status === 'FAILED') summary.failed += 1

    const bucket = summary.byType[r.type]
    if (bucket) {
      bucket.total += 1
      if (r.status === 'SENT') bucket.sent += 1
      if (r.status === 'FAILED') bucket.failed += 1
    }

    return {
      id: r.id,
      jobId: r.jobId,
      jobNo: r.job.jobNo,
      customerName: r.job.customerName,
      productName: r.job.productName,
      branchName: r.job.branch.name,
      type: r.type,
      endpoint: r.endpoint,
      recipientPhone: r.recipientPhone,
      status: r.status,
      httpStatus: r.httpStatus,
      requestPayload: orderLonPayloadBySwagger(r.requestPayload, r.type),
      responseBody: r.responseBody,
      errorMessage: r.errorMessage,
      triggeredBy: r.triggeredBy,
      createdAt: r.createdAt.toISOString(),
    }
  })

  return { summary, logs }
}

export async function fetchRemoteLonReport(params: {
  keyword?: string
  from?: string
  to?: string
  page?: number
  perPage?: number
}): Promise<{ ok: boolean; total: number; data: RemoteLonRecord[]; error?: string }> {
  try {
    const cfg = await getIntegrationConfig()
    const baseUrl = (cfg.LON_API_BASE_URL.trim() || LON_DEFAULT_BASE_URL).replace(/\/+$/, '')
    const res = await lonHttpRequest({
      url: `${baseUrl}/admin/svc_report_perpage`,
      method: 'POST',
      token: cfg.LON_API_TOKEN.trim(),
      body: JSON.stringify({
        current_page: params.page ?? 1,
        per_page: params.perPage ?? 20,
        keyword: params.keyword ?? '',
        created_at_start: params.from || '2026-01-01',
        created_at_end: params.to || '2027-12-31',
      }),
      timeoutMs: 8_000,
    })
    if (!res.ok) {
      return { ok: false, total: 0, data: [], error: `LON Server ตอบกลับ HTTP ${res.status}` }
    }
    const parsed = JSON.parse(res.bodyText) as { total?: string | number; data?: RemoteLonRecord[] }
    return {
      ok: true,
      total: Number(parsed.total ?? (parsed.data?.length ?? 0)),
      data: Array.isArray(parsed.data) ? parsed.data : [],
    }
  } catch (e) {
    return { ok: false, total: 0, data: [], error: e instanceof Error ? e.message : 'เชื่อมต่อ LON Server ไม่สำเร็จ' }
  }
}
