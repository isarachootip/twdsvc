import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const steps = await prisma.slaStep.findMany({
    where: { active: true },
    orderBy: { seq: 'asc' },
  })

  return NextResponse.json(steps)
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const updates: Array<{ id: number; hours: number }> = await req.json()

    const results = await prisma.$transaction(
      updates.map((u) =>
        prisma.slaStep.update({
          where: { id: u.id },
          data: { hours: u.hours },
        })
      )
    )

    return NextResponse.json(results)
  } catch (e) {
    console.error('[PUT /api/admin/sla]', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
