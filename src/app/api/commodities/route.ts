import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

const querySchema = z.object({
  search: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  dept: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(15),
  format: z.enum(['list', 'paged']).optional().default('list'),
})

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    search: url.searchParams.get('search') ?? '',
    brand: url.searchParams.get('brand') ?? '',
    dept: url.searchParams.get('dept') ?? '',
    page: url.searchParams.get('page') ?? '1',
    limit: url.searchParams.get('limit') ?? '15',
    format: url.searchParams.get('format') ?? 'list',
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  const { search, brand, dept, page, limit, format } = parsed.data
  const term = search.trim()

  // If nothing specified and format is list, return empty
  if (!term && !brand && !dept && format === 'list') {
    return NextResponse.json([])
  }

  const where: Prisma.CommodityWhereInput = {
    active: true,
  }

  if (brand && brand !== 'ALL') {
    where.brand = brand
  }

  if (dept && dept !== 'ALL') {
    where.deptName = dept
  }

  if (term) {
    where.OR = [
      { sku: { contains: term, mode: 'insensitive' } },
      { barcode: { contains: term } },
      { name: { contains: term, mode: 'insensitive' } },
      { model: { contains: term, mode: 'insensitive' } },
      { brand: { contains: term, mode: 'insensitive' } },
    ]
  }

  const skip = (page - 1) * limit
  const select = {
    id: true,
    sku: true,
    barcode: true,
    name: true,
    brand: true,
    deptName: true,
    model: true,
    posprice: true,
    active: true,
  }

  if (format === 'paged') {
    const [items, total] = await Promise.all([
      prisma.commodity.findMany({
        where,
        select,
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
  }

  const items = await prisma.commodity.findMany({
    where,
    select,
    take: limit,
    skip,
    orderBy: [{ brand: 'asc' }, { sku: 'asc' }],
  })

  return NextResponse.json(items)
}
