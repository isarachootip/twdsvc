import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const routes = await prisma.branchVendorRoute.findMany({
    include: {
      branch: { select: { code: true, name: true } },
      dcSite: { select: { code: true, name: true } },
      primaryCenter: { select: { code: true, vendorParent: { select: { name: true } } } },
      backupCenter: { select: { code: true, vendorParent: { select: { name: true } } } },
    },
    orderBy: [{ branch: { code: 'asc' } }, { priority: 'asc' }],
  })

  return NextResponse.json(routes)
}
