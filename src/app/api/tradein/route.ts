import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateTradeInNo } from '@/lib/number-generator'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // S3: Scope to branch for non-ADMIN/EXECUTIVE
  let branchWhere: Record<string, unknown> = {}
  if (user.role !== 'ADMIN' && user.role !== 'EXECUTIVE') {
    const branchUsers = await prisma.user.findMany({
      where: { siteId: user.siteId ?? '__none__' },
      select: { username: true },
    })
    branchWhere = {
      OR: [
        { createdBy: { in: branchUsers.map(u => u.username) } },
        { job: { branchId: user.siteId ?? '__none__' } },
      ],
    }
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('search')?.trim()

  const items = await prisma.tradeIn.findMany({
    where: {
      AND: [
        branchWhere,
        q ? {
          OR: [
            { tradeInNo: { contains: q, mode: 'insensitive' } },
            { customerName: { contains: q, mode: 'insensitive' } },
            { customerPhone: { contains: q.replace(/\D/g, '') || q } },
          ],
        } : {},
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { promotion: { select: { name: true } }, job: { select: { jobNo: true, branchId: true } } },
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['CS', 'ADMIN'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const {
      type,
      jobId,
      customerName,
      customerPhone,
      productName,
      brandName,
      sizeCategoryId,
      symptom,
      discountPct,
      promotionId,
    } = await req.json()

    if (!type || !customerName || !customerPhone || !productName)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    if (type === 'TYPE2' && jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId } })
      if (!job) return NextResponse.json({ error: 'ไม่พบงานนี้' }, { status: 404 })
      if (user.role === 'CS' && user.siteId && job.branchId !== user.siteId) {
        return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงงานของสาขาอื่น' }, { status: 403 })
      }
    }

    const tradeInNo = await generateTradeInNo()

    const item = await prisma.tradeIn.create({
      data: {
        tradeInNo,
        type,
        jobId: jobId ?? null,
        customerName,
        customerPhone,
        productName,
        brandName: brandName ?? '-',
        sizeCategoryId: sizeCategoryId ? Number(sizeCategoryId) : null,
        symptom: symptom ?? null,
        discountPct: Number(discountPct),
        promotionId: promotionId ?? null,
        createdBy: user.username,
      },
      include: { promotion: { select: { name: true } }, job: { select: { jobNo: true } } },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    console.error('[POST /api/tradein]', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
