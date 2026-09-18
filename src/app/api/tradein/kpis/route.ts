import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [total, used] = await Promise.all([
    prisma.tradeIn.count(),
    prisma.tradeIn.count({ where: { status: 'USED' } }),
  ])

  const conversion = total > 0 ? Math.round((used / total) * 100) : 0

  return NextResponse.json({ total, used, conversion })
}
