import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sizeCategoryId = searchParams.get('sizeCategoryId')
  const type = searchParams.get('type')
  const today = new Date()

  const promos = await prisma.promotionConfig.findMany({
    where: {
      status: 'ACTIVE',
      startDate: { lte: today },
      endDate: { gte: today },
      ...(sizeCategoryId ? { sizeCategoryId: Number(sizeCategoryId) } : {}),
      ...(type ? { tradeInType: type as 'TYPE1' | 'TYPE2' } : {}),
    },
    orderBy: { discountPct: 'desc' },
    take: 1,
  })

  return NextResponse.json(promos[0] ?? null)
}
