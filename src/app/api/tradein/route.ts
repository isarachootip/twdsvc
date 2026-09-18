import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateTradeInNo } from '@/lib/number-generator'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.tradeIn.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { promotion: { select: { name: true } } },
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
    })

    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    console.error('[POST /api/tradein]', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
