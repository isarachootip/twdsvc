import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sites = await prisma.site.findMany({
    where: { active: true },
    select: { id: true, code: true, name: true, type: true },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  })
  return NextResponse.json(sites)
}
