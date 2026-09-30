import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get('branchId')?.trim()
  const targetBranchId = branchId || (user.role !== 'ADMIN' && user.role !== 'EXECUTIVE' ? user.siteId : undefined)

  let where: Record<string, unknown> = {}
  if (targetBranchId) {
    const branchUsers = await prisma.user.findMany({
      where: { siteId: targetBranchId },
      select: { username: true },
    })
    where = {
      OR: [
        { createdBy: { in: branchUsers.map(u => u.username) } },
        { job: { branchId: targetBranchId } },
      ],
    }
  }

  const [total, used] = await Promise.all([
    prisma.tradeIn.count({ where }),
    prisma.tradeIn.count({ where: { ...where, status: 'USED' } }),
  ])

  const conversion = total > 0 ? Math.round((used / total) * 100) : 0

  return NextResponse.json({ total, used, conversion })
}
