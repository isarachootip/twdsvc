import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { calcBalance, getHoursInStep } from '@/lib/fees'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const job = await prisma.job.findUniqueOrThrow({
      where: { id },
      include: {
        branch: true,
        vendorCenter: { include: { vendorParent: true } },
        events: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
        slaClocks: {
          include: { slaStep: true },
          orderBy: { startedAt: 'asc' },
        },
        shipments: { orderBy: { createdAt: 'asc' } },
        quotes: {
          include: { lines: true },
          orderBy: { version: 'desc' },
        },
        charges: true,
        payments: { orderBy: { createdAt: 'asc' } },
        publicTokens: { where: { type: 'TRACKING' }, take: 1 },
      },
    })

    // Compute balance
    const balance = calcBalance(job.charges, job.payments)

    // Compute SLA for current stage
    const activeClock = job.slaClocks.find(c => c.status === 'RUNNING' || c.status === 'PAUSED')
    const slaInfo = activeClock ? {
      hoursInStep: getHoursInStep(activeClock),
      slaHours: activeClock.slaStep.hours,
      isOverdue: activeClock.breached,
      ownerDept: activeClock.slaStep.ownerDept,
    } : null

    return NextResponse.json({ ...job, balance, slaInfo })
  } catch (e) {
    return NextResponse.json({ error: 'ไม่พบงานนี้' }, { status: 404 })
  }
}
