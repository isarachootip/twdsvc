import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const brands = await prisma.brand.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(brands)
}
