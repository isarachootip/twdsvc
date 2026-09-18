import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sites = await prisma.site.findMany({
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
    include: { _count: { select: { users: true, jobs: true } } },
  })

  return NextResponse.json(sites)
}
