import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'

export async function GET() {
  try {
    // Keep CS and EXECUTIVE allowed to prevent Bug C9
    await requireUser(['ADMIN', 'CS', 'EXECUTIVE'])
    const [sizes, rates] = await Promise.all([
      prisma.sizeCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.feeRate.findMany({
        where: { effectiveFrom: { lte: new Date() } },
        orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
      }),
    ])
    return NextResponse.json(
      sizes.map(sz => ({
        sizeCategory: sz,
        rate: rates.find(r => r.sizeCategoryId === sz.id) ?? null,
      }))
    )
  } catch (e) {
    return handleError(e)
  }
}

// PUT [{ sizeCategoryId?, name?, operationFee, shippingFee3pl }]
export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'])
    const updates: Array<{
      sizeCategoryId?: number | null
      name?: string
      operationFee: number
      shippingFee3pl: number
    }> = await req.json()

    const current = await prisma.feeRate.findMany({
      orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
    })

    await prisma.$transaction(async tx => {
      for (const u of updates) {
        const op = Math.round(Number(u.operationFee))
        const sh = Math.round(Number(u.shippingFee3pl))
        if (!(op >= 0) || !(sh >= 0)) {
          throw new HttpError(400, 'ค่าธรรมเนียมต้องเป็นตัวเลข ≥ 0')
        }

        let sizeId = u.sizeCategoryId
        if (!sizeId) {
          if (!u.name?.trim()) {
            throw new HttpError(400, 'กรุณาระบุชื่อประเภทสินค้าใหม่')
          }
          const count = await tx.sizeCategory.count()
          const sz = await tx.sizeCategory.create({
            data: {
              code: `SIZE_${Date.now().toString(36).toUpperCase()}`,
              name: u.name.trim(),
              sortOrder: count + 1,
            },
          })
          sizeId = sz.id
        } else if (u.name?.trim()) {
          await tx.sizeCategory.update({
            where: { id: sizeId },
            data: { name: u.name.trim() },
          })
        }

        const latest = current.find(r => r.sizeCategoryId === sizeId)
        if (!latest || latest.operationFee !== op || latest.shippingFee3pl !== sh) {
          await tx.feeRate.create({
            data: {
              sizeCategoryId: sizeId,
              operationFee: op,
              shippingFee3pl: sh,
              effectiveFrom: new Date(),
            },
          })
        }
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
