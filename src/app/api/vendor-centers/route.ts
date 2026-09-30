import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const centers = await prisma.vendorCenter.findMany({
    where: { active: true },
    include: { vendorParent: { select: { name: true, code: true } } },
    orderBy: { code: 'asc' },
  })

  return NextResponse.json(centers)
}
