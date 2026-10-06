import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'

import { z } from 'zod'

const feeUpdateSchema = z.array(
  z.object({
    sizeCategoryId: z.number().nullable().optional(),
    name: z.string().optional(),
    operationFee: z.coerce.number().min(0, 'ค่าธรรมเนียมต้องเป็นตัวเลข ≥ 0'),
    shippingFee3pl: z.coerce.number().min(0, 'ค่าขนส่งต้องเป็นตัวเลข ≥ 0'),
  })
)

function toBaht(val: number): number {
  return val >= 1000 ? Math.round(val / 100) : val
}

function toSatang(val: number): number {
  if (val >= 1000) return Math.round(val)
  return Math.round(val * 100)
}

export async function GET(req: NextRequest) {
  try {
    // Keep CS and EXECUTIVE allowed to prevent Bug C9
    await requireUser(['ADMIN', 'CS', 'EXECUTIVE'], req)
    const [sizes, rates] = await Promise.all([
      prisma.sizeCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.feeRate.findMany({
        where: { effectiveFrom: { lte: new Date() } },
        orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
      }),
    ])
    return NextResponse.json(
      sizes.map(sz => {
        const r = rates.find(rate => rate.sizeCategoryId === sz.id)
        return {
          sizeCategory: sz,
          rate: r
            ? {
                ...r,
                operationFee: toBaht(r.operationFee),
                shippingFee3pl: toBaht(r.shippingFee3pl),
              }
            : null,
        }
      })
    )
  } catch (e) {
    return handleError(e)
  }
}

// PUT [{ sizeCategoryId?, name?, operationFee, shippingFee3pl }]
export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const rawBody = await req.json()
    const parsed = feeUpdateSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง')
    }
    const updates = parsed.data

    const current = await prisma.feeRate.findMany({
      orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
    })

    await prisma.$transaction(async tx => {
      for (const u of updates) {
        const opSatang = toSatang(u.operationFee)
        const shSatang = toSatang(u.shippingFee3pl)

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
        const latestOp = latest ? toSatang(latest.operationFee) : null
        const latestSh = latest ? toSatang(latest.shippingFee3pl) : null

        if (!latest || latestOp !== opSatang || latestSh !== shSatang) {
          await tx.feeRate.create({
            data: {
              sizeCategoryId: sizeId,
              operationFee: opSatang,
              shippingFee3pl: shSatang,
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
