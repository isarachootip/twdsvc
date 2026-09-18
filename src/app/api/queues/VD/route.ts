import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { JobStage } from '@prisma/client'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const vendorCenterId = user.vendorCenterId

  const scope = vendorCenterId ? { vendorCenterId } : {}

  const [incoming, inspecting, waitingApproval, repairing, returnPacking] = await Promise.all([
    prisma.job.findMany({ where: { ...scope, stage: JobStage.OUTBOUND_TO_VD }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 } } }),
    prisma.job.findMany({ where: { ...scope, stage: JobStage.VD_INSPECTING }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 }, quotes: { orderBy: { version: 'desc' }, take: 1 } } }),
    prisma.job.findMany({ where: { ...scope, stage: JobStage.WAITING_APPROVAL }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 }, quotes: { orderBy: { version: 'desc' }, take: 1, include: { lines: true } } } }),
    prisma.job.findMany({ where: { ...scope, stage: JobStage.REPAIRING }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 } } }),
    prisma.job.findMany({ where: { ...scope, stage: JobStage.RETURN_PACKING }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 } } }),
  ])

  const overdueJobs = [...incoming, ...inspecting, ...waitingApproval, ...repairing, ...returnPacking].filter(j => j.slaClocks.some(c => c.breached))

  return NextResponse.json({
    tabs: { incoming, inspecting, waiting_approval: waitingApproval, repairing, return_packing: returnPacking },
    kpis: { incoming: incoming.length, inspecting: inspecting.length, waiting_approval: waitingApproval.length, repairing: repairing.length, return_packing: returnPacking.length },
    overdueJobs,
  })
}
