import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { calcBalance, getHoursInStep } from '@/lib/fees'
import { calcMoney, maskPhone } from '@/lib/job-view'
import { resolveOwner } from '@/lib/sla-engine'
import { executeAction } from '@/lib/state-machine'
import { buildJobStageTimeline, enrichJobEvents } from '@/lib/job-timeline'
import type { Stage } from '@/lib/constants'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req)
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
        publicTokens: { where: { usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } },
      },
    })

    // S1: Enforce tenant and role scoping (fail-closed if siteId/vendorCenterId missing)
    if (['CS', 'GR', 'S2'].includes(user.role) && (!user.siteId || job.branchId !== user.siteId)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงงานของสาขาอื่น' }, { status: 403 })
    }
    if (user.role === 'VD' && (!user.vendorCenterId || job.vendorCenterId !== user.vendorCenterId)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงงานของศูนย์ซ่อมอื่น' }, { status: 403 })
    }
    if (user.role === 'DC' && job.channel !== 'DC') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงงานที่ไม่ได้ผ่าน DC' }, { status: 403 })
    }

    // Compute balance and financial breakdown
    const balance = calcBalance(job.charges, job.payments)
    const money = calcMoney(job)
    const intakeUnpaid = job.type === 'CUSTOMER' && money.intakeBalance > 0

    // Compute SLA for current stage
    const activeClock = job.slaClocks.find(c => c.status === 'RUNNING' || c.status === 'PAUSED')
    const slaInfo = activeClock ? {
      hoursInStep: getHoursInStep(activeClock),
      slaHours: activeClock.slaStep.hours,
      isOverdue: activeClock.breached,
      ownerDept: resolveOwner(activeClock.slaStep.ownerDept, activeClock.slaStep.code, job.channel),
    } : null

    // Build public links dictionary
    const links: Record<string, string> = {}
    job.publicTokens.forEach((t) => {
      if (!links[t.type]) {
        if (t.type === 'TRACKING') links.TRACKING = `/t/${t.token}`
        else if (t.type === 'QUOTE') links.QUOTE = `/q/${t.token}`
        else if (t.type === 'PAYMENT') links.PAYMENT = `/pay/${t.token}`
      }
    })

    // Resolve actor user names for events and timeline
    const actorIds = Array.from(
      new Set(job.events.map((e) => e.actorUserId).filter((uid): uid is string => Boolean(uid)))
    )
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, fullName: true, role: true },
        })
      : []
    const actorNames: Record<string, string> = {}
    for (const a of actors) {
      actorNames[a.id] = `${a.fullName} (${a.role})`
    }

    const timeline = buildJobStageTimeline({
      stage: job.stage as Stage,
      channel: job.channel,
      openedAt: job.openedAt,
      events: job.events,
      slaClocks: job.slaClocks,
      actorNames,
    })

    const enrichedEvents = enrichJobEvents(job.events, actorNames)

    return NextResponse.json({
      ...job,
      events: enrichedEvents,
      timeline,
      customerPhone: maskPhone(job.customerPhone, user.role),
      balance,
      money,
      intakeUnpaid,
      slaInfo,
      links,
    })
  } catch (e) {
    return NextResponse.json({ error: 'ไม่พบงานนี้' }, { status: 404 })
  }
}

// C8: PATCH /api/jobs/[id] for S2 stock repair closing and general status patching
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const rawAction = String(body.action ?? '').trim().toUpperCase()
  if (rawAction === 'CLOSE' || rawAction === 'CS_CLOSE' || body.action === 'cs_close') {
    const result = await executeAction(id, 'cs_close', body as any, {
      userId: user.id,
      role: user.role,
      siteId: user.siteId,
      vendorCenterId: user.vendorCenterId,
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
    }
    return NextResponse.json(result.job)
  }

  return NextResponse.json({ error: 'Unsupported PATCH action' }, { status: 400 })
}
