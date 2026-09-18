import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const search = new URL(req.url).searchParams.get('search') ?? ''
  if (!search) return NextResponse.json([])

  const items = await prisma.commodity.findMany({
    where: {
      active: true,
      OR: [
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ],
    },
    take: 10,
  })
  return NextResponse.json(items)
}
