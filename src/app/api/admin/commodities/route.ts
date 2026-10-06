import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'

const querySchema = z.object({
  search: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  dept: z.string().optional().default(''),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
})

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN', 'CS', 'EXECUTIVE', 'GR', 'DC', 'VD', 'S2'], req)

    const url = new URL(req.url)
    const parsed = querySchema.safeParse({
      search: url.searchParams.get('search') ?? '',
      brand: url.searchParams.get('brand') ?? '',
      dept: url.searchParams.get('dept') ?? '',
      status: url.searchParams.get('status') ?? 'all',
      page: url.searchParams.get('page') ?? '1',
      limit: url.searchParams.get('limit') ?? '25',
    })

    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'พารามิเตอร์ไม่ถูกต้อง')
    }

    const { search, brand, dept, status, page, limit } = parsed.data
    const where: Prisma.CommodityWhereInput = {}

    if (status === 'active') {
      where.active = true
    } else if (status === 'inactive') {
      where.active = false
    }

    if (brand && brand !== 'ALL') {
      where.brand = brand
    }

    if (dept && dept !== 'ALL') {
      where.deptName = dept
    }

    const term = search.trim()
    if (term) {
      where.OR = [
        { sku: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term } },
        { ibc: { contains: term } },
        { sbc: { contains: term } },
        { name: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      prisma.commodity.findMany({
        where,
        take: limit,
        skip,
        orderBy: [{ brand: 'asc' }, { sku: 'asc' }],
      }),
      prisma.commodity.count({ where }),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (e) {
    return handleError(e)
  }
}
