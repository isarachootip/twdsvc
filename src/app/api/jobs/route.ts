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

// GET /api/jobs?from&to&stage&type&branchId&channel&search&flag&limit
// kpis = การ์ด SLA (งานที่ยังไม่ปิดทั้งหมด ไม่ขึ้นกับ from/to); jobs = ตารางรายการที่กรองตามเงื่อนไข
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(undefined, req)
    await refreshBreaches()
    return NextResponse.json(await listJobs(user, new URL(req.url).searchParams))
  } catch (e) {
    return handleError(e)
  }
}

// POST /api/jobs — เปิดใบแจ้งซ่อม (action `open`, 04 §3)
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['CS', 'ADMIN'], req)
    const body = (await req.json()) as Record<string, unknown>
    const {
      productName, brandName, brandId, symptom, customerName, customerPhone,
      customerAddress, customerZip, hasWarranty = false, shippingMethod: rawMethod = 'STANDARD',
      sizeCategoryId, sku, serialNo, allowNonAuth = false,
      taxInvoiceName, taxInvoiceId, taxInvoiceAddr,
      defectNote, photos, paymentMethod, posReceiptNo,
    } = body

    const phone = String(customerPhone ?? '').replace(/\D/g, '')
    if (!String(customerName ?? '').trim()) throw new HttpError(400, 'กรุณากรอกชื่อลูกค้า')
    if (!/^0\d{8,9}$/.test(phone)) throw new HttpError(400, 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)')
    if (!String(productName ?? '').trim()) throw new HttpError(400, 'กรุณากรอกชื่อสินค้า')
    if (!String(brandName ?? '').trim()) throw new HttpError(400, 'กรุณาเลือกแบรนด์')
    if (!String(symptom ?? '').trim()) throw new HttpError(400, 'กรุณากรอกอาการเสีย')
    if (!sizeCategoryId) throw new HttpError(400, 'กรุณาเลือกขนาดสินค้า')
    if (taxInvoiceId && !/^\d{13}$/.test(String(taxInvoiceId))) throw new HttpError(400, 'เลขผู้เสียภาษีต้องมี 13 หลัก')

    const validPhotos = Array.isArray(photos)
      ? photos.filter((p: unknown): p is { fileUrl: string; fileName?: string; mimeType?: string; fileSize?: number } =>
          typeof p === 'object' && p !== null && 'fileUrl' in p && Boolean((p as { fileUrl?: unknown }).fileUrl)
        )
      : []
    if (validPhotos.length === 0) throw new HttpError(400, 'กรุณาแนบภาพถ่ายสินค้าอย่างน้อย 1 รูป')

    const shippingMethod: 'STANDARD' | 'EXPRESS' = rawMethod === 'EXPRESS' ? 'EXPRESS' : 'STANDARD'

    let branchId: string | undefined = user.role === 'ADMIN' ? (((body.branchId as string) || user.siteId) ?? undefined) : user.siteId ?? undefined
    if (!branchId && user.role === 'ADMIN') {
      let defaultBranch = await prisma.site.findFirst({
        where: { type: 'BRANCH', active: true },
        orderBy: { code: 'asc' },
        select: { id: true },
      }) ?? await prisma.site.findFirst({
        where: { type: 'BRANCH' },
        orderBy: { code: 'asc' },
        select: { id: true },
      }) ?? await prisma.site.findFirst({
        orderBy: { code: 'asc' },
        select: { id: true },
      })
      if (!defaultBranch) {
        defaultBranch = await prisma.site.create({
          data: {
            code: 'HQ-001',
            name: 'สาขาสำนักงานใหญ่ (ระบบสร้างอัตโนมัติ)',
            nickname: 'HQ',
            type: 'BRANCH',
            active: true,
            province: 'กรุงเทพมหานคร',
          },
          select: { id: true },
        })
      }
      branchId = defaultBranch.id
    }
    if (!branchId) throw new HttpError(400, 'ผู้ใช้ไม่ได้ผูกกับสาขา และไม่พบสาขาในระบบ')

    const routing = await resolveRouting({
      branchId, brandId: brandId ? Number(brandId) : null, sizeCategoryId: Number(sizeCategoryId),
      shippingMethod, allowNonAuth: !!allowNonAuth, jobType: 'CUSTOMER',
    })
    const stage: JobStage = routing ? 'CS_OPENED' : 'PENDING_VENDOR_ASSIGNMENT'
    const channel: Channel | null = routing ? routing.channel : (shippingMethod === 'EXPRESS' ? 'TPL' : null)

    const feeRate = await prisma.feeRate.findFirst({
      where: { sizeCategoryId: Number(sizeCategoryId), effectiveFrom: { lte: new Date() } },
      orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
    })
    const fees = calcIntakeFees({
      jobType: 'CUSTOMER', hasWarranty: !!hasWarranty, shippingMethod,
      feeRate: { operationFee: feeRate?.operationFee ?? 0, shippingFee3pl: feeRate?.shippingFee3pl ?? 0 },
    })
    if (fees.total > 0 && paymentMethod === 'POS_RECEIPT' && !String(posReceiptNo ?? '').trim()) {
      throw new HttpError(400, 'กรุณากรอกเลขที่ใบเสร็จ POS')
    }

    const jobNo = await generateJobNo(branchId)
    const now = new Date()

    const result = await prisma.$transaction(async tx => {
      const job = await tx.job.create({
        data: {
          jobNo, type: 'CUSTOMER', stage, channel, branchId,
          vendorCenterId: routing?.vendorCenterId ?? null,
          customerName: String(customerName).trim(), customerPhone: phone,
          customerAddress: (customerAddress as string) || null, customerZip: (customerZip as string) || null,
          taxInvoiceName: (taxInvoiceName as string) || null, taxInvoiceId: (taxInvoiceId as string) || null, taxInvoiceAddr: (taxInvoiceAddr as string) || null,
          sku: (sku as string) || null, productName: String(productName).trim(), brandName: String(brandName).trim(),
          brandId: brandId ? Number(brandId) : null, sizeCategoryId: Number(sizeCategoryId),
          symptom: String(symptom).trim(), serialNo: (serialNo as string) || null, hasWarranty: !!hasWarranty,
          shippingMethod, allowNonAuth: !!allowNonAuth, createdBy: user.username,
          openedAt: now, stageEnteredAt: now,
        },
      })
      if (fees.operationFee > 0) await tx.jobCharge.create({ data: { jobId: job.id, type: 'OPERATION_FEE', amount: fees.operationFee, description: 'ค่าดำเนินการ' } })
      if (fees.shippingFee > 0) await tx.jobCharge.create({ data: { jobId: job.id, type: 'SHIPPING_FEE', amount: fees.shippingFee, description: 'ค่าขนส่ง 3PL' } })

      const extra: Record<string, string> = {}
      if (fees.total > 0) {
        const method: PaymentMethod = paymentMethod === 'CARD_LINK' || paymentMethod === 'POS_RECEIPT' ? paymentMethod : 'PROMPTPAY_QR'
        const paid = method === 'POS_RECEIPT'
        for (const [type, amount] of [['OPERATION_FEE', fees.operationFee], ['SHIPPING_FEE', fees.shippingFee]] as const) {
          if (amount > 0) {
            await tx.payment.create({
              data: {
                jobId: job.id, chargeType: type, amount, method, status: paid ? 'PAID' : 'PENDING',
                posReceiptNo: paid ? String(posReceiptNo).trim() : null, receivedAt: paid ? now : null, receivedBy: paid ? user.id : null,
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
          note: defectNote ? `ตำหนิ: ${defectNote}` : null,
          payload: { defectNote: defectNote || null, paymentMethod: paymentMethod || null, routing: routing ? { centerCode: routing.centerCode, channel: routing.channel } : null },
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

    return NextResponse.json({
      id: result.job.id,
      jobNo: result.job.jobNo,
      stage: result.job.stage,
      fees,
      routing,
      ...result.extra,
    }, { status: 201 })
  } catch (e) {
    return handleError(e)
  }
}
