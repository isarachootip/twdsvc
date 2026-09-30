import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { Prisma, JobStage, Channel, PaymentMethod } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser, jobScope, handleError, HttpError } from '@/lib/api'
import { generateJobNo } from '@/lib/number-generator'
import { calcIntakeFees } from '@/lib/fees'
import { resolveRouting } from '@/lib/routing'
import { slaOnEvent, refreshBreaches } from '@/lib/sla-engine'
import { JOB_LIST_INCLUDE, serializeJob, type JobView } from '@/lib/job-view'
import { STAGE_ORDER } from '@/lib/constants'

function bkkStart(d: string) { return new Date(`${d}T00:00:00+07:00`) }
function bkkEnd(d: string) { return new Date(`${d}T23:59:59.999+07:00`) }

// GET /api/jobs?from&to&stage&type&branchId&channel&search&flag&limit
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(undefined, req)
    await refreshBreaches()
    const sp = new URL(req.url).searchParams
    const scope = await jobScope(user)
    const and: Prisma.JobWhereInput[] = [scope]

    const stages = (sp.get('stage') ?? '').split(',').filter(s => STAGE_ORDER.includes(s as never)) as JobStage[]
    if (stages.length) and.push({ stage: { in: stages } })
    const type = sp.get('type')
    if (type === 'CUSTOMER' || type === 'STOCK') and.push({ type })
    const branchId = sp.get('branchId')
    if (branchId) and.push({ branchId })
    const channel = sp.get('channel')
    if (channel === 'DC' || channel === 'DSD' || channel === 'TPL') and.push({ channel: channel as Channel })
    const from = sp.get('from')
    const to = sp.get('to')
    if (from) and.push({ openedAt: { gte: bkkStart(from) } })
    if (to) and.push({ openedAt: { lte: bkkEnd(to) } })
    if (sp.get('open') === '1') and.push({ stage: { notIn: ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'] } })
    const search = (sp.get('search') ?? '').trim()
    if (search) {
      const digits = search.replace(/\D/g, '')
      and.push({
        OR: [
          { jobNo: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { receiverName: { contains: search, mode: 'insensitive' } },
          { items: { some: { sku: { contains: search, mode: 'insensitive' } } } },
          { vendorCenter: { code: { contains: search, mode: 'insensitive' } } },
          { vendorCenter: { vendorParent: { name: { contains: search, mode: 'insensitive' } } } },
          ...(digits.length >= 4 ? [{ customerPhone: { contains: digits } }] : []),
        ],
      })
    }
    const limit = Math.min(1000, Math.max(1, Number(sp.get('limit') ?? '300')))

    const rows = await prisma.job.findMany({
      where: { AND: and },
      take: limit,
      orderBy: { openedAt: 'desc' },
      include: JOB_LIST_INCLUDE,
    })
    let jobs: JobView[] = rows.map(j => serializeJob(j, user.role))

    const kpis = {
      total: jobs.length,
      GR: jobs.filter(j => j.overdue && j.overdueOwner === 'GR').length,
      VD: jobs.filter(j => j.overdue && j.overdueOwner === 'VD').length,
      transport: jobs.filter(j => j.overdue && ['DC', 'TPL', 'CARRIER'].includes(j.overdueOwner ?? '')).length,
      CS: jobs.filter(j => j.overdue && ['CS', 'CUSTOMER'].includes(j.overdueOwner ?? '')).length,
      unpaid: jobs.filter(j => j.unpaid).length,
      overdue: jobs.filter(j => j.overdue).length,
    }

    const flag = sp.get('flag')
    if (flag === 'unpaid') jobs = jobs.filter(j => j.unpaid)
    else if (flag === 'overdue') jobs = jobs.filter(j => j.overdue)
    else if (flag === 'GR' || flag === 'VD') jobs = jobs.filter(j => j.overdue && j.overdueOwner === flag)
    else if (flag === 'transport') jobs = jobs.filter(j => j.overdue && ['DC', 'TPL', 'CARRIER'].includes(j.overdueOwner ?? ''))
    else if (flag === 'CS') jobs = jobs.filter(j => j.overdue && ['CS', 'CUSTOMER'].includes(j.overdueOwner ?? ''))

    return NextResponse.json({ jobs, kpis, total: jobs.length })
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

    const jobNo = await generateJobNo('CUSTOMER')
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
      if (Array.isArray(photos) && photos.length) {
        await tx.attachment.createMany({
          data: photos.slice(0, 5).map((p: { fileUrl: string; fileName?: string; mimeType?: string; fileSize?: number }) => ({
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
