import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { JobStage, Channel, PaymentMethod } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { generateJobNo } from '@/lib/number-generator'
import { calcIntakeFees } from '@/lib/fees'
import { resolveRouting } from '@/lib/routing'
import { slaOnEvent, refreshBreaches } from '@/lib/sla-engine'
import { listJobs } from '@/lib/jobs-list'
import { jobIntakeSchema } from '@/lib/validations/job-intake.schema'
import { resolveLonIntakeTrigger } from '@/lib/services/lon-trigger-rules'
import { dispatchLonNotification } from '@/lib/services/lon-notify.service'

// GET /api/jobs?from&to&stage&type&branchId&channel&productGroup&search&flag&limit
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(undefined, req)
    await refreshBreaches()
    return NextResponse.json(await listJobs(user, new URL(req.url).searchParams))
  } catch (e) {
    return handleError(e)
  }
}

async function resolveIntakeBranchId(role: string, userSiteId: string | null, requestedBranchId?: string): Promise<string> {
  let branchId = role === 'ADMIN' ? (requestedBranchId || userSiteId || undefined) : (userSiteId ?? undefined)
  if (!branchId && role === 'ADMIN') {
    const existing =
      (await prisma.site.findFirst({ where: { type: 'BRANCH', active: true }, orderBy: { code: 'asc' }, select: { id: true } })) ??
      (await prisma.site.findFirst({ where: { type: 'BRANCH' }, orderBy: { code: 'asc' }, select: { id: true } })) ??
      (await prisma.site.findFirst({ orderBy: { code: 'asc' }, select: { id: true } }))
    const created = existing ?? (await prisma.site.create({
      data: { code: 'HQ-001', name: 'สาขาสำนักงานใหญ่ (ระบบสร้างอัตโนมัติ)', nickname: 'HQ', type: 'BRANCH', active: true, province: 'กรุงเทพมหานคร' },
      select: { id: true },
    }))
    branchId = created.id
  }
  if (!branchId) throw new HttpError(400, 'ผู้ใช้ไม่ได้ผูกกับสาขา และไม่พบสาขาในระบบ')
  return branchId
}

// POST /api/jobs — เปิดใบแจ้งซ่อม (action `open`, 04 §3)
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['CS', 'ADMIN'], req)
    const rawBody = (await req.json()) as Record<string, unknown>

    const parsed = jobIntakeSchema.safeParse({
      ...rawBody,
      customerName: String(rawBody.customerName ?? ''),
      customerPhone: String(rawBody.customerPhone ?? ''),
      productName: String(rawBody.productName ?? ''),
      brandName: String(rawBody.brandName ?? ''),
      symptom: String(rawBody.symptom ?? ''),
      shippingMethod: rawBody.shippingMethod === 'EXPRESS' ? 'EXPRESS' : 'STANDARD',
      hasWarranty: Boolean(rawBody.hasWarranty),
      allowNonAuth: Boolean(rawBody.allowNonAuth),
    })
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลเปิดใบแจ้งซ่อมไม่ถูกต้อง')
    }
    const d = parsed.data

    const validPhotos = Array.isArray(rawBody.photos)
      ? rawBody.photos.filter((p: unknown): p is { fileUrl: string; fileName?: string; mimeType?: string; fileSize?: number } =>
          typeof p === 'object' && p !== null && 'fileUrl' in p && Boolean((p as { fileUrl?: unknown }).fileUrl)
        )
      : []
    if (validPhotos.length === 0) throw new HttpError(400, 'กรุณาแนบภาพถ่ายสินค้าอย่างน้อย 1 รูป')

    const branchId = await resolveIntakeBranchId(user.role, user.siteId ?? null, d.branchId)
    const brandIdNum = d.brandId ? Number(d.brandId) : null

    const routing = await resolveRouting({
      branchId,
      brandId: brandIdNum,
      sizeCategoryId: d.sizeCategoryId,
      productGroupName: d.productGroupName,
      shippingMethod: d.shippingMethod,
      allowNonAuth: d.allowNonAuth,
      jobType: 'CUSTOMER',
    })
    const stage: JobStage = routing ? 'CS_OPENED' : 'PENDING_VENDOR_ASSIGNMENT'
    const channel: Channel | null = routing ? routing.channel : (d.shippingMethod === 'EXPRESS' ? 'TPL' : null)

    const feeRate = await prisma.feeRate.findFirst({
      where: { sizeCategoryId: d.sizeCategoryId, effectiveFrom: { lte: new Date() } },
      orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
    })
    const fees = calcIntakeFees({
      jobType: 'CUSTOMER',
      hasWarranty: d.hasWarranty,
      shippingMethod: d.shippingMethod,
      feeRate: { operationFee: feeRate?.operationFee ?? 0, shippingFee3pl: feeRate?.shippingFee3pl ?? 0 },
    })
    if (fees.total > 0 && d.paymentMethod === 'POS_RECEIPT' && !(d.posReceiptNo ?? '').trim()) {
      throw new HttpError(400, 'กรุณากรอกเลขที่ใบเสร็จ POS')
    }

    const jobNo = await generateJobNo(branchId)
    const now = new Date()

    const result = await prisma.$transaction(async tx => {
      const job = await tx.job.create({
        data: {
          jobNo, type: 'CUSTOMER', stage, channel, branchId,
          vendorCenterId: routing?.vendorCenterId ?? null,
          customerName: d.customerName, customerPhone: d.customerPhone,
          customerAddress: d.customerAddress || null, customerZip: d.customerZip || null,
          taxInvoiceName: d.taxInvoiceName || null, taxInvoiceId: d.taxInvoiceId || null, taxInvoiceAddr: d.taxInvoiceAddr || null,
          sku: d.sku || null, productName: d.productName, productGroupName: d.productGroupName,
          brandName: d.brandName, brandId: brandIdNum, sizeCategoryId: d.sizeCategoryId,
          symptom: d.symptom, serialNo: d.serialNo || null, hasWarranty: d.hasWarranty,
          shippingMethod: d.shippingMethod, allowNonAuth: d.allowNonAuth, createdBy: user.username,
          openedAt: now, stageEnteredAt: now,
        },
      })
      if (fees.operationFee > 0) await tx.jobCharge.create({ data: { jobId: job.id, type: 'OPERATION_FEE', amount: fees.operationFee, description: 'ค่าดำเนินการ' } })
      if (fees.shippingFee > 0) await tx.jobCharge.create({ data: { jobId: job.id, type: 'SHIPPING_FEE', amount: fees.shippingFee, description: 'ค่าขนส่ง 3PL' } })

      const extra: Record<string, string> = {}
      if (fees.total > 0) {
        const method: PaymentMethod = d.paymentMethod === 'CARD_LINK' || d.paymentMethod === 'POS_RECEIPT' ? d.paymentMethod : 'PROMPTPAY_QR'
        const paid = method === 'POS_RECEIPT'
        for (const [type, amount] of [['OPERATION_FEE', fees.operationFee], ['SHIPPING_FEE', fees.shippingFee]] as const) {
          if (amount > 0) {
            await tx.payment.create({
              data: {
                jobId: job.id, chargeType: type, amount, method, status: paid ? 'PAID' : 'PENDING',
                posReceiptNo: paid ? String(d.posReceiptNo).trim() : null, receivedAt: paid ? now : null, receivedBy: paid ? user.id : null,
              },
            })
          }
        }
        if (!paid) {
          const payToken = crypto.randomBytes(24).toString('base64url')
          await tx.publicToken.create({ data: { jobId: job.id, type: 'PAYMENT', token: payToken, expiresAt: new Date(now.getTime() + 7 * 86400000) } })
          extra.payUrl = `/pay/${payToken}`
        }
      }

      const event = await tx.jobEvent.create({
        data: {
          jobId: job.id, type: 'JOB_OPENED', toStage: stage, actorUserId: user.id, actorRole: user.role,
          note: d.defectNote ? `ตำหนิ: ${d.defectNote}` : null,
          payload: { defectNote: d.defectNote || null, productGroupName: d.productGroupName, paymentMethod: d.paymentMethod || null, routing: routing ? { centerCode: routing.centerCode, channel: routing.channel } : null },
        },
      })
      if (validPhotos.length) {
        await tx.attachment.createMany({
          data: validPhotos.slice(0, 5).map(p => ({
            jobEventId: event.id, kind: 'INTAKE', fileUrl: p.fileUrl, fileName: p.fileName ?? 'photo.jpg', mimeType: p.mimeType ?? null, fileSize: p.fileSize ?? null, uploadedBy: user.id,
          })),
        })
      }
      const trackToken = crypto.randomBytes(24).toString('base64url')
      await tx.publicToken.create({ data: { jobId: job.id, type: 'TRACKING', token: trackToken, expiresAt: new Date(now.getTime() + 90 * 86400000) } })
      extra.trackingUrl = `/t/${trackToken}`

      await slaOnEvent(tx, { id: job.id, type: job.type, channel: job.channel, vendorCenterId: job.vendorCenterId }, 'JOB_OPENED', now)
      return { job, extra }
    }, { timeout: 20000 })

    const lonTrigger = resolveLonIntakeTrigger({
      type: result.job.type,
      isTest: result.job.isTest,
      customerPhone: result.job.customerPhone,
    })
    if (lonTrigger) {
      void dispatchLonNotification({ jobId: result.job.id, type: lonTrigger.type, statusLabel: lonTrigger.statusLabel, req })
    }

    return NextResponse.json({ id: result.job.id, jobNo: result.job.jobNo, stage: result.job.stage, fees, routing, ...result.extra }, { status: 201 })
  } catch (e) {
    return handleError(e)
  }
}
