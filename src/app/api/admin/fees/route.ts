import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [sizes, rates] = await Promise.all([
    prisma.sizeCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.feeRate.findMany({ orderBy: { effectiveFrom: 'desc' } }),
  ])

  // Get latest fee rate per size category
  const latestRates = sizes.map((sz) => {
    const rate = rates.find((r) => r.sizeCategoryId === sz.id)
    return { sizeCategory: sz, rate: rate ?? null }
  })

  return NextResponse.json(latestRates)
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const updates: Array<{ sizeCategoryId: number; operationFee: number; shippingFee3pl: number }> =
      await req.json()

    const results = await Promise.all(
      updates.map((u) =>
        prisma.feeRate.create({
          data: {
            sizeCategoryId: u.sizeCategoryId,
            operationFee: u.operationFee,
            shippingFee3pl: u.shippingFee3pl,
            effectiveFrom: new Date(),
          },
        })
      )
    )

    return NextResponse.json(results)
  } catch (e) {
    console.error('[PUT /api/admin/fees]', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
