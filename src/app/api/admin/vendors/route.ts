import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const vendors = await prisma.vendorParent.findMany({
    where: { active: true },
    include: {
      brands: { include: { brand: true } },
      centers: {
        select: { id: true, code: true, address: true, phone: true, deliveryMethod: true, active: true, gpPctOverride: true },
      },
    },
    orderBy: { code: 'asc' },
  })

  return NextResponse.json(vendors)
}
