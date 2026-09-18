import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      site: { select: { code: true, name: true } },
      vendorCenter: { select: { code: true } },
    },
  })

  return NextResponse.json(users)
}
