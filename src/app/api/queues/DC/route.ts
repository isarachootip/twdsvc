import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { JobStage, Channel } from '@prisma/client'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [fromBranch, outbound, atDcOut, returnFromVD, atDcIn] = await Promise.all([
    prisma.job.findMany({ where: { stage: JobStage.GR_PACKED, channel: Channel.DC }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 } } }),
    prisma.job.findMany({ where: { stage: JobStage.OUTBOUND_TO_DC }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 } } }),
    prisma.job.findMany({ where: { stage: JobStage.AT_DC_OUTBOUND }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 } } }),
    prisma.job.findMany({ where: { stage: JobStage.INBOUND_TO_DC }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 } } }),
    prisma.job.findMany({ where: { stage: JobStage.AT_DC_INBOUND }, include: { branch: { select: { nickname: true } }, slaClocks: { include: { slaStep: true }, take: 1 } } }),
  ])

  const overdueJobs = [...fromBranch, ...outbound, ...atDcOut, ...returnFromVD, ...atDcIn].filter(j => j.slaClocks.some(c => c.breached))

  return NextResponse.json({
    tabs: { from_branch: fromBranch, outbound_to_dc: outbound, at_dc_outbound: atDcOut, return_from_vd: returnFromVD, at_dc_inbound: atDcIn },
    kpis: { from_branch: fromBranch.length, outbound_to_dc: outbound.length, at_dc_outbound: atDcOut.length, return_from_vd: returnFromVD.length, at_dc_inbound: atDcIn.length },
    overdueJobs,
  })
}
