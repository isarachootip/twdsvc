import crypto from 'crypto'
import { Prisma, type LonNotificationLog } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ensureCsatToken, ensurePaymentToken, ensureTrackingToken } from '@/lib/public-token'
import { publicBaseUrl } from '@/lib/settings'
import { getIntegrationConfig } from '@/lib/services/integration-config.service'
import { buildLonNotificationRequest } from '@/lib/services/lon-mapper'
import { getLonEndpointToggles, saveLonEndpointToggles } from '@/lib/services/lon-toggles.service'
import {
  LON_ENDPOINTS,
  normalizeThaiMobilePhone,
  type LonStatus,
  type LonType,
} from '@/lib/validations/lon.schema'

export { getLonEndpointToggles, saveLonEndpointToggles }

const LON_TIMEOUT_MS = 10_000

export interface LonDispatchResult {
  ok: boolean
  status: LonStatus
  endpoint: string
  logId?: string
  error?: string
}

async function ensureQuoteToken(jobId: string): Promise<string> {
  const existing = await prisma.publicToken.findFirst({
    where: { jobId, type: 'QUOTE', usedAt: null },
    orderBy: { createdAt: 'desc' },
  })
  if (existing) return existing.token
  const token = crypto.randomBytes(24).toString('base64url')
  await prisma.publicToken.create({
    data: { jobId, type: 'QUOTE', token, expiresAt: new Date(Date.now() + 14 * 86400000) },
  })
  return token
}

export async function listJobLonLogs(jobId: string): Promise<LonNotificationLog[]> {
  return prisma.lonNotificationLog.findMany({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
}

/** Best-effort LON dispatcher. Never throws so business state transitions are never blocked. */
export async function dispatchLonNotification(params: {
  jobId: string
  type: LonType
  statusLabel?: string
  triggeredBy?: string
  req?: Request
}): Promise<LonDispatchResult> {
  const endpoint = LON_ENDPOINTS[params.type]
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        branch: { select: { name: true, phone: true } },
        items: { select: { sku: true, productName: true, quantity: true, symptom: true } },
        charges: { select: { type: true, amount: true } },
        quotes: {
          where: { status: { in: ['SENT', 'APPROVED'] } },
          orderBy: { version: 'desc' },
          take: 1,
          include: { lines: { select: { description: true, quantity: true, unitPrice: true } } },
        },
      },
    })
    if (!job || job.type !== 'CUSTOMER') {
      return { ok: false, status: 'SKIPPED', endpoint, error: 'ไม่ใช่งานซ่อมลูกค้า' }
    }

    const phone = normalizeThaiMobilePhone(job.customerPhone)
    if (!phone) {
      return { ok: false, status: 'SKIPPED', endpoint, error: 'เบอร์โทรศัพท์ลูกค้าไม่ถูกต้องสำหรับส่ง LON' }
    }

    const trackingToken = await ensureTrackingToken(job.id)
    const activeQuote = job.quotes[0] ?? null
    const quoteToken = params.type === 'SEND_PRICE' ? await ensureQuoteToken(job.id) : null
    const paymentToken =
      params.type === 'SEND_PRICE' && (activeQuote?.total ?? 0) > 0 ? await ensurePaymentToken(job.id) : null
    const csatToken = params.type === 'SATISFACTION' ? await ensureCsatToken(job.id) : null

    const cfg = await getIntegrationConfig()
    const appBaseUrl = cfg.APP_BASE_URL || publicBaseUrl(params.req) || 'http://localhost:3000'
    const operationFeeAmount = job.charges
      .filter((c) => c.type === 'OPERATION_FEE')
      .reduce((sum, c) => sum + c.amount, 0)

    const built = buildLonNotificationRequest(
      {
        jobNo: job.jobNo,
        stage: job.stage,
        customerName: job.customerName,
        customerPhone: phone,
        sku: job.sku,
        productName: job.productName,
        brandName: job.brandName,
        serialNo: job.serialNo,
        symptom: job.symptom,
        openedAt: job.openedAt,
        closedAt: job.closedAt,
        branch: job.branch,
        items: job.items,
        operationFeeAmount,
        activeQuote,
        tokens: { tracking: trackingToken, quote: quoteToken, payment: paymentToken, csat: csatToken },
      },
      params.type,
      { baseUrl: appBaseUrl, statusLabel: params.statusLabel }
    )

    const toggles = await getLonEndpointToggles()
    const payloadJson = built.payload as unknown as Prisma.InputJsonValue
    const actor = params.triggeredBy ?? 'AUTO'

    if (!toggles[params.type]) {
      const log = await prisma.lonNotificationLog.create({
        data: {
          jobId: job.id,
          type: params.type,
          endpoint: built.endpoint,
          recipientPhone: built.recipientPhone,
          status: 'SKIPPED',
          requestPayload: payloadJson,
          errorMessage: 'ปิดสวิตช์ Endpoint นี้ไว้ในตั้งค่าการเชื่อมต่อ (รอเปิดใช้งาน)',
          triggeredBy: actor,
        },
      })
      return { ok: true, status: 'SKIPPED', endpoint: built.endpoint, logId: log.id }
    }

    const lonBaseUrl = cfg.LON_API_BASE_URL.trim()
    const lonToken = cfg.LON_API_TOKEN.trim()

    if (!lonBaseUrl || !lonToken) {
      const log = await prisma.lonNotificationLog.create({
        data: {
          jobId: job.id,
          type: params.type,
          endpoint: built.endpoint,
          recipientPhone: built.recipientPhone,
          status: 'SIMULATED',
          requestPayload: payloadJson,
          responseBody: 'SIMULATED (ยังไม่ได้ตั้งค่า LON_API_BASE_URL / LON_API_TOKEN)',
          triggeredBy: actor,
        },
      })
      return { ok: true, status: 'SIMULATED', endpoint: built.endpoint, logId: log.id }
    }

    const res = await fetch(`${lonBaseUrl.replace(/\/+$/, '')}${built.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${lonToken}`,
        'X-API-Key': lonToken,
      },
      body: JSON.stringify(built.payload),
      signal: AbortSignal.timeout(LON_TIMEOUT_MS),
    })

    const bodyText = (await res.text().catch(() => '')).slice(0, 1000)
    const status: LonStatus = res.ok ? 'SENT' : 'FAILED'
    const log = await prisma.lonNotificationLog.create({
      data: {
        jobId: job.id,
        type: params.type,
        endpoint: built.endpoint,
        recipientPhone: built.recipientPhone,
        status,
        httpStatus: res.status,
        requestPayload: payloadJson,
        responseBody: bodyText || null,
        errorMessage: res.ok ? null : `LON HTTP ${res.status}: ${bodyText.slice(0, 200) || res.statusText}`,
        triggeredBy: actor,
      },
    })
    return { ok: res.ok, status, endpoint: built.endpoint, logId: log.id, error: log.errorMessage ?? undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LON dispatch failed'
    console.error('[dispatchLonNotification]', params.type, msg)
    return { ok: false, status: 'FAILED', endpoint, error: msg }
  }
}
