import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'
import { ensurePaymentToken } from '@/lib/public-token'
import { getJsonSetting, getSetting, publicBaseUrl } from '@/lib/settings'
import { getIntegrationConfig } from '@/lib/services/integration-config.service'
import { executeAction } from '@/lib/state-machine'
import {
  EOrderingExternalResponseSchema,
  type EOrderingKind,
  type EOrderingOrderPayload,
  type EOrderingWebhookPayload,
} from '@/lib/validations/eordering.schema'
import {
  buildEOrderingOrderPayload,
  findReusableEOrderingQr,
  type RepairSkuConfig,
} from './eordering-mapper'

export interface EOrderingQrResult {
  orderRef: string
  qrPayload: string | null
  qrImageUrl: string | null
  payUrl: string
  token: string
  expiresAt: string
  reused: boolean
  payloadSent: EOrderingOrderPayload
}

const QR_TTL_MS = 15 * 60 * 1000 // 15 นาที

async function callExternalEOrderingApi(
  apiUrl: string,
  apiKey: string,
  payload: EOrderingOrderPayload
): Promise<{ orderRef: string; qrPayload: string | null; qrImageUrl: string | null; expiresAt: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
      headers['X-API-Key'] = apiKey
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new HttpError(502, `ระบบ E-ordering ตอบกลับผิดพลาด (${res.status}): ${errText.slice(0, 120) || res.statusText}`)
    }

    const rawJson: unknown = await res.json()
    const parsed = EOrderingExternalResponseSchema.safeParse(rawJson)
    if (!parsed.success) {
      throw new HttpError(502, 'รูปแบบข้อมูลตอบกลับจากระบบ E-ordering ไม่ถูกต้อง')
    }

    const data = parsed.data
    const orderRef = data.orderRef || data.orderNo || `EO-${payload.jobNo}-${Date.now().toString(36).toUpperCase()}`
    const qrPayload = data.qrPayload ?? data.qrCode ?? null
    const qrImageUrl = data.qrImageUrl ?? null
    const expiresAt = data.expiresAt ?? new Date(Date.now() + QR_TTL_MS).toISOString()

    return { orderRef, qrPayload, qrImageUrl, expiresAt }
  } catch (err) {
    if (err instanceof HttpError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new HttpError(504, 'การเชื่อมต่อระบบ E-ordering หมดเวลา (Timeout) กรุณาลองใหม่อีกครั้ง')
    }
    throw new HttpError(502, err instanceof Error ? `เชื่อมต่อระบบ E-ordering ไม่สำเร็จ: ${err.message}` : 'เชื่อมต่อระบบ E-ordering ไม่สำเร็จ')
  } finally {
    clearTimeout(timer)
  }
}

export async function requestEOrderingQr(
  jobId: string,
  kind: EOrderingKind,
  options: { forceNew?: boolean; actorUserId?: string | null; actorRole?: string | null; req?: Request } = {}
): Promise<EOrderingQrResult> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      branch: { select: { code: true, stCode: true, name: true } },
      charges: true,
      payments: true,
      events: {
        where: { type: 'EORDERING_QR_CREATED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!job) throw new HttpError(404, 'ไม่พบใบแจ้งซ่อมในระบบ')

  const skus = await getJsonSetting<RepairSkuConfig[]>('REPAIR_SKUS')
  const cfg = await getIntegrationConfig()
  const baseUrl = cfg.APP_BASE_URL || publicBaseUrl(options.req) || 'http://localhost:3000'
  const callbackUrl = `${baseUrl.replace(/\/+$/, '')}/api/webhooks/e-ordering`

  const orderPayload = buildEOrderingOrderPayload(job, kind, skus, callbackUrl)
  if (orderPayload.totalAmount <= 0 || orderPayload.items.length === 0) {
    throw new HttpError(400, 'ไม่มียอดค้างชำระสำหรับสร้าง QR Code')
  }

  const token = await ensurePaymentToken(job.id)
  const payUrl = `/pay/${token}`
  const now = new Date()

  const reusable = findReusableEOrderingQr(
    job.events,
    kind,
    orderPayload.totalAmount,
    now,
    Boolean(options.forceNew)
  )

  if (reusable) {
    return {
      orderRef: reusable.orderRef,
      qrPayload: reusable.qrPayload,
      qrImageUrl: reusable.qrImageUrl,
      payUrl: reusable.payUrl || payUrl,
      token,
      expiresAt: reusable.expiresAt,
      reused: true,
      payloadSent: orderPayload,
    }
  }

  const apiUrl = cfg.EORDERING_API_URL.trim()
  const apiKey = cfg.EORDERING_API_KEY.trim()
  const demoMode = (await getSetting('DEMO_MODE')) !== 'false'

  let externalRes: { orderRef: string; qrPayload: string | null; qrImageUrl: string | null; expiresAt: string }

  if (apiUrl) {
    externalRes = await callExternalEOrderingApi(apiUrl, apiKey, orderPayload)
  } else if (demoMode) {
    const orderRef = `EO-${job.jobNo}-${Date.now().toString(36).toUpperCase()}`
    externalRes = {
      orderRef,
      qrPayload: `${baseUrl.replace(/\/+$/, '')}${payUrl}`,
      qrImageUrl: null,
      expiresAt: new Date(now.getTime() + QR_TTL_MS).toISOString(),
    }
  } else {
    throw new HttpError(503, 'ยังไม่ได้ตั้งค่า EORDERING_API_URL ในระบบตั้งค่าการเชื่อมต่อ')
  }

  await prisma.$transaction(async tx => {
    const targetTypes = kind === 'intake' ? (['OPERATION_FEE', 'SHIPPING_FEE'] as const) : (['REPAIR', 'INSPECTION_FEE'] as const)
    const pendingCount = await tx.payment.count({
      where: { jobId: job.id, status: 'PENDING', chargeType: { in: [...targetTypes] } },
    })

    if (pendingCount > 0) {
      await tx.payment.updateMany({
        where: { jobId: job.id, status: 'PENDING', chargeType: { in: [...targetTypes] } },
        data: { externalRef: externalRes.orderRef, method: 'PROMPTPAY_QR' },
      })
    } else {
      for (const item of orderPayload.items) {
        await tx.payment.create({
          data: {
            jobId: job.id,
            chargeType: item.chargeType === 'SHIPPING_FEE' ? 'SHIPPING_FEE' : item.chargeType === 'OPERATION_FEE' ? 'OPERATION_FEE' : item.chargeType === 'INSPECTION_FEE' ? 'INSPECTION_FEE' : 'REPAIR',
            amount: item.amount,
            method: 'PROMPTPAY_QR',
            status: 'PENDING',
            externalRef: externalRes.orderRef,
          },
        })
      }
    }

    await tx.jobEvent.create({
      data: {
        jobId: job.id,
        type: 'EORDERING_QR_CREATED',
        actorUserId: options.actorUserId ?? null,
        actorRole: options.actorRole ?? null,
        note: `ส่งข้อมูลสร้าง QR ไปยังระบบ E-ordering (${externalRes.orderRef}) ยอด ฿${orderPayload.totalAmount.toLocaleString()}`,
        payload: {
          kind,
          totalAmount: orderPayload.totalAmount,
          orderRef: externalRes.orderRef,
          qrPayload: externalRes.qrPayload,
          qrImageUrl: externalRes.qrImageUrl,
          payUrl,
          expiresAt: externalRes.expiresAt,
          items: orderPayload.items,
        },
      },
    })
  })

  return {
    orderRef: externalRes.orderRef,
    qrPayload: externalRes.qrPayload,
    qrImageUrl: externalRes.qrImageUrl,
    payUrl,
    token,
    expiresAt: externalRes.expiresAt,
    reused: false,
    payloadSent: orderPayload,
  }
}

export async function confirmEOrderingWebhook(payload: EOrderingWebhookPayload) {
  const job = await prisma.job.findUnique({
    where: { jobNo: payload.jobNo },
    select: { id: true, jobNo: true, stage: true, version: true },
  })
  if (!job) throw new HttpError(404, `ไม่พบใบแจ้งซ่อมเลขที่ ${payload.jobNo}`)

  if (payload.status === 'FAILED' || payload.status === 'CANCELLED') {
    await prisma.jobEvent.create({
      data: {
        jobId: job.id,
        type: 'EORDERING_PAYMENT_FAILED',
        note: `การชำระเงินผ่าน E-ordering ไม่สำเร็จ (${payload.status}) Ref: ${payload.orderRef ?? '-'}`,
        payload: { ...payload },
      },
    })
    return { success: false, status: payload.status, jobNo: job.jobNo }
  }

  const isIntake = ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT', 'GR_RECEIVED'].includes(job.stage)
  const action = isIntake ? 'record_intake_payment' : 'record_repair_payment'
  const receiptRef = payload.posReceiptNo || payload.orderRef || `EO-${Date.now().toString(36).toUpperCase()}`

  const res = await executeAction(
    job.id,
    action,
    {
      paymentMethod: payload.paymentMethod ?? 'PROMPTPAY_QR',
      amount: payload.amount ? Math.round(Number(payload.amount)) : undefined,
      posReceiptNo: receiptRef,
      note: `รับชำระเงินผ่านระบบ E-ordering (Ref: ${receiptRef})`,
    },
    { userId: null, role: 'CUSTOMER' }
  )

  if (!res.success) {
    throw new HttpError(res.status ?? 400, res.error ?? 'ไม่สามารถบันทึกผลการชำระเงินได้')
  }

  if (payload.orderRef) {
    await prisma.payment.updateMany({
      where: { jobId: job.id, status: 'PAID', externalRef: null },
      data: { externalRef: payload.orderRef },
    })
  }

  return {
    success: true,
    jobNo: job.jobNo,
    orderRef: payload.orderRef ?? receiptRef,
    paidAmount: (res.extra?.paidAmount as number | undefined) ?? payload.amount ?? 0,
  }
}
