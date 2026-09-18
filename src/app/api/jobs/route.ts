import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { JobStage, JobType, Channel } from '@prisma/client'
import { generateJobNo } from '@/lib/number-generator'
import { calcIntakeFees } from '@/lib/fees'

function buildScope(user: { role: string; siteId?: string | null; vendorCenterId?: string | null }) {
  if (user.role === 'ADMIN' || user.role === 'EXECUTIVE') return {}
  if (user.role === 'CS' || user.role === 'GR' || user.role === 'S2') return { branchId: user.siteId ?? '' }
  if (user.role === 'DC') return { channel: Channel.DC }
  if (user.role === 'VD') return { vendorCenterId: user.vendorCenterId ?? '' }
  return {}
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage') as JobStage | null
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Number(searchParams.get('limit') ?? '50'))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    ...buildScope(user),
    ...(stage ? { stage } : {}),
    ...(search ? {
      OR: [
        { jobNo: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: { openedAt: 'desc' },
      include: {
        branch: { select: { name: true, nickname: true } },
        vendorCenter: { select: { code: true, vendorParent: { select: { name: true } } } },
        slaClocks: {
          where: { status: { in: ['RUNNING', 'PAUSED'] } },
          include: { slaStep: { select: { code: true, ownerDept: true, hours: true } } },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
        charges: { select: { amount: true, type: true } },
        payments: { select: { amount: true, status: true } },
      },
    }),
    prisma.job.count({ where }),
  ])

  return NextResponse.json({ jobs, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['CS', 'ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const {
      productName, brandName, brandId, symptom, customerName, customerPhone,
      customerAddress, customerZip, hasWarranty = false, shippingMethod = 'STANDARD',
      sizeCategoryId, sku, serialNo, allowNonAuth = false,
    } = body

    if (!productName || !brandName || !customerName || !customerPhone || !symptom) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ' }, { status: 400 })
    }

    const branchId = user.siteId
    if (!branchId) return NextResponse.json({ error: 'ไม่พบข้อมูลสาขา' }, { status: 400 })

    // Resolve routing
    let vendorCenterId: string | null = null
    let channel: Channel = Channel.DC
    let stage: JobStage = JobStage.CS_OPENED

    if (shippingMethod === 'EXPRESS') {
      channel = Channel.TPL
    }

    const route = await prisma.branchVendorRoute.findFirst({
      where: { branchId },
      include: {
        primaryCenter: { include: { vendorParent: { include: { brands: true } } } },
      },
      orderBy: { priority: 'asc' },
    })

    if (route?.primaryCenter) {
      const vendor = route.primaryCenter.vendorParent
      const hasBrand = !brandId || vendor.brands.some((b) => b.brandId === Number(brandId))
      if (hasBrand || allowNonAuth) {
        vendorCenterId = route.primaryCenter.id
        channel = shippingMethod === 'EXPRESS' ? Channel.TPL : route.standardChannel
      }
    }

    if (!vendorCenterId) {
      stage = JobStage.PENDING_VENDOR_ASSIGNMENT
    }

    // Get fee rate
    let feeResult = { operationFee: 0, shippingFee: 0, total: 0 }
    if (sizeCategoryId) {
      const feeRate = await prisma.feeRate.findFirst({
        where: { sizeCategoryId: Number(sizeCategoryId) },
        orderBy: { effectiveFrom: 'desc' },
      })
      if (feeRate) {
        feeResult = calcIntakeFees({
          jobType: 'CUSTOMER',
          hasWarranty,
          shippingMethod,
          feeRate: { operationFee: feeRate.operationFee, shippingFee3pl: feeRate.shippingFee3pl },
        })
      }
    }

    const jobNo = await generateJobNo('CUSTOMER')

    const job = await prisma.$transaction(async (tx) => {
      const newJob = await tx.job.create({
        data: {
          jobNo, type: JobType.CUSTOMER, stage, channel,
          branchId, vendorCenterId,
          customerName, customerPhone, customerAddress, customerZip,
          sku, productName, brandName, brandId: brandId ? Number(brandId) : null,
          sizeCategoryId: sizeCategoryId ? Number(sizeCategoryId) : null,
          symptom, serialNo, hasWarranty, shippingMethod, allowNonAuth,
          createdBy: user.username,
        },
      })

      // Create charges
      if (feeResult.operationFee > 0) {
        await tx.jobCharge.create({ data: { jobId: newJob.id, type: 'OPERATION_FEE', amount: feeResult.operationFee, description: 'ค่าดำเนินการ' } })
      }
      if (feeResult.shippingFee > 0) {
        await tx.jobCharge.create({ data: { jobId: newJob.id, type: 'SHIPPING_FEE', amount: feeResult.shippingFee, description: 'ค่าขนส่ง 3PL' } })
      }

      // Create job event
      await tx.jobEvent.create({
        data: {
          jobId: newJob.id, type: 'JOB_OPENED',
          toStage: stage,
          actorUserId: user.id, actorRole: user.role,
        },
      })

      // Create tracking token
      const crypto = await import('crypto')
      const trackToken = crypto.randomBytes(32).toString('base64url')
      await tx.publicToken.create({
        data: { jobId: newJob.id, type: 'TRACKING', token: trackToken, expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000) },
      })

      return newJob
    })

    return NextResponse.json(job, { status: 201 })
  } catch (e) {
    console.error('[POST /api/jobs]', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
