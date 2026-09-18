import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { JobStage } from '@prisma/client'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const branchId = user.siteId ?? ''

  const [csOpened, grReceived, grPacked, inbound, returnReceived] = await Promise.all([
    prisma.job.findMany({ where: { branchId, stage: JobStage.CS_OPENED }, include: { slaClocks: { include: { slaStep: true }, orderBy: { startedAt: 'desc' }, take: 1 } } }),
    prisma.job.findMany({ where: { branchId, stage: JobStage.GR_RECEIVED }, include: { slaClocks: { include: { slaStep: true }, orderBy: { startedAt: 'desc' }, take: 1 } } }),
    prisma.job.findMany({ where: { branchId, stage: JobStage.GR_PACKED }, include: { slaClocks: { include: { slaStep: true }, orderBy: { startedAt: 'desc' }, take: 1 } } }),
    prisma.job.findMany({ where: { branchId, stage: JobStage.INBOUND_TO_BRANCH }, include: { slaClocks: { include: { slaStep: true }, orderBy: { startedAt: 'desc' }, take: 1 } } }),
    prisma.job.findMany({ where: { branchId, stage: JobStage.GR_RETURN_RECEIVED }, include: { slaClocks: { include: { slaStep: true }, orderBy: { startedAt: 'desc' }, take: 1 } } }),
  ])

  const all = [...csOpened, ...grReceived, ...grPacked, ...inbound, ...returnReceived]
  const overdueJobs = all.filter(j => j.slaClocks.some(c => c.breached))

  return NextResponse.json({
    tabs: { cs_opened: csOpened, gr_received: grReceived, gr_packed: grPacked, inbound, return_received: returnReceived },
    kpis: { cs_opened: csOpened.length, gr_received: grReceived.length, gr_packed: grPacked.length, inbound: inbound.length, return_received: returnReceived.length },
    overdueJobs,
  })
}
